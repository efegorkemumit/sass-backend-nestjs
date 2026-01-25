import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrganizationInput } from './dto';
import { AuditAction, MembershipRole } from 'generated/prisma/enums';

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




}
