import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateServiceInput } from './dto';
import { requireOrgRole } from 'src/common/authz/org-authz';
import { AuditAction, MembershipRole, ServiceStatus } from 'generated/prisma/enums';

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

}
