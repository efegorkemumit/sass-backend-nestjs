import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrganizationInput, UpdateOrganizationInput } from './dto';
import { AuditAction, MembershipRole } from 'generated/prisma/enums';
import { requireMembership, requireOrgRole } from 'src/common/authz/org-authz';

@Injectable()
export class OrganizationsService {

    constructor(private readonly prisma:PrismaService){}

    private toSlug(raw:string):string{
         return (raw ?? "")
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[ı]/g, "i")
            .replace(/[ğ]/g, "g")
            .replace(/[ü]/g, "u")
            .replace(/[ş]/g, "s")
            .replace(/[ö]/g, "o")
            .replace(/[ç]/g, "c")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 70);

    }

    private async ensureSlugUnique(base:string):Promise<string>{
        let candidate = base;
        let i = 2;

        while (true){
            const exists = await this.prisma.organization.findUnique({
                where:{slug:candidate},
                select:{id:true}
            })
            if(!exists) return candidate;
            candidate = `${base}-${i}`;
            i++
            if(i>50) throw new BadRequestException("Could not generate unique slug.");
        }
    }



    private async requireOrganization(organizationId:string){
        const org = await this.prisma.organization.findUnique({
            where:{id:organizationId},
            select:{id:true}
        })

        if(!org) throw new NotFoundException("Organization not found.");
        return org
    }


    /*POST */
    async create(userId:string, dto:CreateOrganizationInput){
        const name = dto.name.trim();
        if (!name) throw new BadRequestException("Organization name is required.");

        const baseSlug  = dto.slug?.trim()
            ? this.toSlug(dto.slug.trim())
            : this.toSlug(name)

        if (!baseSlug) throw new BadRequestException("Slug could not be generated.");

        const slug = await this.ensureSlugUnique(baseSlug);

        const created = await this.prisma.$transaction(async(tx)=>{
            const org = await tx.organization.create({
                data:{
                    name,
                    slug,
                    timezone:dto.timezone?.trim() || "Europe/Istanbul",
                    isActive:true
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    timezone: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
                
            });

            await tx.membership.create({
                data:{
                    userId,
                    organizationId:org.id,
                    role:MembershipRole.OWNER
                },
                select:{id:true}
            });

            await tx.auditLog.create({
                data:{
                    action: AuditAction.CREATE,
                    userId,
                    organizationId:org.id,
                    entity:"Organization",
                    entityId:org.id,
                    meta:{name:org.name, slug:org.slug}
                }
            })

            return org;
        })

        return created;

    }

    /*GET */
    async listMine(userId:string, query?:{isActive?:boolean}){
        const rows = await this.prisma.organization.findMany({
            where:{
                ...(query?.isActive !==undefined ? {isActive: query.isActive}: {}),
                members:{some:{userId}},
            },
            orderBy:{createdAt:"desc"},
            select:{
                id:true,
                name:true,
                slug:true,
                timezone:true,
                isActive:true,
                createdAt:true,
                updatedAt:true,
                members:{
                    where:{userId},
                    select:{role:true},
                    take:1
                }
            }
        })

        return rows.map((o)=>({
            id:o.id,
            name:o.name,
            slug:o.slug,
            timezone:o.timezone,
            isActive:o.isActive,
            cretedAt:o.createdAt,
            updatedAt:o.updatedAt,
            myRole:o.members?.[0]?.role ?? null,
        }))
    }

    /*GET */
    async getOne(userId :string, organizationId:string){
        await requireMembership(this.prisma, userId, organizationId)

        const org = await this.prisma.organization.findUnique({
            where:{id:organizationId},
            select:{
                    id: true,
                    name: true,
                    slug: true,
                    timezone: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
            }
        });

        if(!org) throw new NotFoundException("Organization not found.");
        return org
    }

    /*PATCH */

    async update(
        userId:string,
        organizationId:string,
        dto:UpdateOrganizationInput
    ){

        await this.requireOrganization(organizationId);

        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
            MembershipRole.ADMIN
        ])

        const data: any = {}

        if(dto.name !==undefined){
            const n = dto.name.trim();
            if(!n) throw new BadRequestException("Organization name cannot be empty.");
            data.name = n
        } 
        
        if (dto.slug !== undefined) {
            const s = this.toSlug(dto.slug.trim());
            if (!s) throw new BadRequestException("Invalid slug.");
            data.slug = await this.ensureSlugUnique(s);
        }

        if (dto.timezone !== undefined) {
            const tz = dto.timezone.trim();
            if (!tz) throw new BadRequestException("Timezone cannot be empty.");
            data.timezone = tz;
        }

        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }

        if(Object.keys(data).length ===0){
             throw new BadRequestException("Nothing to update.");
        }

        const updated = await this.prisma.organization.update({
            where:{id:organizationId},
            data,
            select:{
                id: true,
                name: true,
                slug: true,
                timezone: true,
                isActive: true,
                updatedAt: true,
            }
        })

        await this.prisma.auditLog.create({
            data:{
                action:AuditAction.UPDATE,
                userId,
                organizationId,
                entity:"Organization",
                entityId:organizationId,
                meta:{fields :Object.keys(data)}
            }
        })

        return updated;

    }


    /*PATCH */

    async archive(userId:string, organizationId:string){

        await this.requireOrganization(organizationId);

        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER
        ])

        const updated = await this.prisma.organization.update({
            where:{id:organizationId},
            data : {isActive :false},
            select:{
                id: true,
                name: true,
                slug: true,
                timezone: true,
                isActive: true,
                updatedAt: true,
            }
        })

        await this.prisma.auditLog.create({
            data:{
                action:AuditAction.UPDATE,
                userId,
                organizationId,
                entity:"Organization",
                entityId:organizationId,
                meta:{archived : true}
            }
        })

         return updated;
    }


        /*PATCH */

    async unarchive(userId:string, organizationId:string){

        await this.requireOrganization(organizationId);

        await requireOrgRole(this.prisma, userId, organizationId,[
            MembershipRole.OWNER,
        ])

        const updated = await this.prisma.organization.update({
            where:{id:organizationId},
            data : {isActive :true},
            select:{
                id: true,
                name: true,
                slug: true,
                timezone: true,
                isActive: true,
                updatedAt: true,
            }
        })

        await this.prisma.auditLog.create({
            data:{
                action:AuditAction.UPDATE,
                userId,
                organizationId,
                entity:"Organization",
                entityId:organizationId,
                meta:{unarchived : true}
            }
        })

        return updated;


    }



     



}
