import { ForbiddenException } from "@nestjs/common";
import { MembershipRole } from "generated/prisma/enums";
import { PrismaService } from "src/prisma.service";

export async function requireMembership(prisma:PrismaService, userId:string, organizationId:string){
    const m = await prisma.membership.findUnique({
            where:{userId_organizationId:{userId, organizationId}},
            select:{id:true, role:true}
    })

    if(!m)  throw new ForbiddenException("Not a member of this organization.");
    return m;

}

export async function requireOrgRole(
            prisma:PrismaService,
            userId:string,
            organizationId:string,
            allowed:MembershipRole[]
){
            const m = await requireMembership(prisma, userId, organizationId);
            if(!allowed.includes(m.role)){
                throw new ForbiddenException("Insufficient role for this action.");
    
            }
            return m;
}
    