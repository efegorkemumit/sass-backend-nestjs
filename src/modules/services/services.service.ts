import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AddServiceStaffInput, CreateServiceInput, ListServicesQuery, UpdateServiceInput } from './dto';
import { requireOrgRole } from 'src/common/authz/org-authz';
import { AuditAction, MembershipRole, ServiceStatus } from 'generated/prisma/enums';
import { skip } from 'node:test';
import { email } from 'zod';

@Injectable()
export class ServicesService {

    constructor (private readonly prisma:PrismaService){}

    private serviceSelect ={
            id: true,
            organizationId: true,
            name: true,
            description: true,
            durationMin: true,
            priceCents: true,
            currency: true,
            status: true,
            createdAt: true,
            updatedAt: true,
    }

    private staffLinkSelect = {
        id: true,
        serviceId: true,
        memberId: true,
        createdAt: true,
        member:{
            select:{
                id:true,
                role:true,
                user:{
                    select:{
                        id:true,
                        email:true,
                        fullName:true
                    }
                }
            }
        }

    }
    private async requireServiceInOrg(organizationId:string, serviceId:string){
        const s = await this.prisma.service.findFirst({
            where:{id:serviceId, organizationId},
            select:this.serviceSelect
        });

        if(!s) throw new NotFoundException("Service not found.");
        return s;
    }

    private async requireStaffMembership(organizationId:string, memberId:string){
        const m=  await this.prisma.membership.findFirst({
            where:{id:memberId, organizationId},
            select:{id:true, role:true}
        })

        if(!m)  throw new NotFoundException("Membership not found.");
        if(m.role === MembershipRole.CUSTOMER){
             throw new BadRequestException("Only staff members can be assigned.");
        }

         return m;
    }



    async create(userId:string, organizationId:string, dto:CreateServiceInput){
        const name = dto.name.trim();
        if(!name) throw new BadRequestException("Service name is required");

        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
            MembershipRole.ADMIN
        ]);

        const created = await this.prisma.service.create({
            data:{
                organizationId,
                name,
                description:dto.description ?? null,
                durationMin:dto.durationMin,
                priceCents:dto.priceCents ?? 0,
                currency:dto.currency ?? "TRY",
                status:ServiceStatus.ACTIVE
            },
            select:this.serviceSelect
        });

        await this.prisma.auditLog.create({
            data: {
                action: AuditAction.CREATE,
                userId,
                organizationId,
                entity: "Service",
                entityId: created.id,
                meta: {
                name: created.name,
                durationMin: created.durationMin,
                priceCents: created.priceCents,
                currency: created.currency,
                },
            },
        });


        return created;
    }

    async update(userId:string, organizationId:string, serviceId:string, dto:UpdateServiceInput){
        
        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
            MembershipRole.ADMIN
        ]);

        await this.requireServiceInOrg(organizationId, serviceId);

        const data: any ={}
        
        if(dto.name !== undefined){
            const n = dto.name.trim();
            if(!n) throw new BadRequestException("Service name cannot be empty");
            data.name = n;
        }

        if(dto.description !== undefined) data.description = data.description ?? null;
        if(dto.durationMin !== undefined) data.durationMin = data.durationMin;
        if(dto.priceCents !== undefined) data.priceCents = data.priceCents ?? null;

        if(dto.currency !==undefined){
            const c = (dto.currency ?? "").toString().trim();
            data.currency = c || "TRY"
        }

        if(Object.keys(data).length ===0){
            throw new BadRequestException("Nothing to update")
        }

        const updated = await this.prisma.service.update({
            where:{id:serviceId},
            data,
            select:this.serviceSelect
        });

        if(updated.organizationId !== organizationId){
            throw new ForbiddenException("Cross-tenant write blocked.");
        }

        await this.prisma.auditLog.create({
            data: {
                action: AuditAction.UPDATE,
                userId,
                organizationId,
                entity: "Service",
                entityId: updated.id,
                meta: { fields: Object.keys(data) },
            },
        });

        return updated;
    }

    async setStatus(userId:string, organizationId:string, serviceId:string, status:"ACTIVE" | "DISABLED"){
        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
        ])

        const existing = await this.requireServiceInOrg(organizationId, serviceId);

        if(existing.status === status) return existing;

        const updated = await this.prisma.service.update({
            where:{id:serviceId},
            data:{status:status as any},
            select:this.serviceSelect
        });

        if (updated.organizationId !== organizationId) {
            throw new ForbiddenException("Cross-tenant write blocked.");
        }

        await this.prisma.auditLog.create({
        data: {
            action: AuditAction.UPDATE,
            userId,
            organizationId,
            entity: "Service",
            entityId: updated.id,
            meta: { status: updated.status },
        },
        });

        return updated;



    }

    async list(userId:string, organizationId:string, query:ListServicesQuery){
        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.STAFF
        ]);

        const q = query.q?.trim();
        const where: any ={
            organizationId,
            ...(query.status ? {status:query.status}: {}),
            ...(q
                ?
                {
                    OR:[
                        {name:{contains :q, mode:"insensitive"}},
                        {description: {contains :q, mode:"insensitive"}}
                    ]
                }
                :
                {}
            ),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.service.findMany({
                where,
                orderBy:{createdAt:"desc"},
                skip:query.skip ?? 0,
                take: query.take ?? 50,
                select:this.serviceSelect
            }),
            this.prisma.service.count({where})
        ])

        return{
            items,
            page:{
                total,
                take:query.take ?? 50,
                skip: query.skip ?? 0
            }
        }

    }

    async getOne(userId:string, organizationId:string, serviceId:string){
        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.STAFF
        ]);

        return this.requireServiceInOrg(organizationId, serviceId);
    }

    /// STAFF

    async listStaff(userId:string, organizationId:string, serviceId:string){
        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.STAFF
        ]);

        await this.requireServiceInOrg(organizationId, serviceId);

        return this.prisma.serviceStaff.findMany({
            where:{serviceId},
            orderBy:{createdAt:"desc"},
            select:this.staffLinkSelect
        })
    }

    async addStaff(userId:string, organizationId:string, serviceId:string, dto:AddServiceStaffInput){
        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
        ]);

        await this.requireServiceInOrg(organizationId, serviceId);
        await this.requireStaffMembership(organizationId, dto.memberId);

        const existing = await this.prisma.serviceStaff.findUnique({
            where:{serviceId_memberId: {serviceId, memberId:dto.memberId}},
            select:this.staffLinkSelect
        });

        if(existing) return existing;

        const created = await this.prisma.serviceStaff.create({
            data:{
                serviceId,
                memberId:dto.memberId
            },
            select:this.staffLinkSelect
        })

        await this.prisma.auditLog.create({
             data: {
                action: AuditAction.CREATE,
                userId,
                organizationId,
                entity: "ServiceStaff",
                entityId: created.id,
                meta: { serviceId, memberId: dto.memberId },
            },

        })

        return created


    }

    async removeStaff(userId:string, organizationId:string, serviceId:string, memberId:string){
        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
        ]);

        await this.requireServiceInOrg(organizationId, serviceId);

        const existing = await this.prisma.serviceStaff.findUnique({
            where:{serviceId_memberId: {serviceId, memberId}},
            select:this.staffLinkSelect
        });

        if(!existing) throw new NotFoundException("Service staff link not found.");

        await this.prisma.serviceStaff.delete({
            where:{serviceId_memberId : {serviceId, memberId}}
        })

        await this.prisma.auditLog.create({
            data: {
                action: AuditAction.DELETE,
                userId,
                organizationId,
                entity: "ServiceStaff",
                entityId: existing.id,
                meta: { serviceId, memberId },
            },
        });

        return {removed : true};

    }




}
