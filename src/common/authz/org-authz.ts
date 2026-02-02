import { ForbiddenException } from "@nestjs/common";
import { MembershipRole } from "generated/prisma/enums";



export async function requireMembership(userId:string, organizationId:string){
        const m = await this.prisma.membership.findUnique({
            where:{userId_organizationId:{userId, organizationId}},
            select:{id:true, role:true}
        })

        if(!m)  throw new ForbiddenException("Not a member of this organization.");
        return m;

}

export async function requireOrgRole(
        userId:string,
        organizationId:string,
        allowed:MembershipRole[]
    ){
        const m = await this.requireMembership(userId, organizationId);
        if(!allowed.includes(m.role)){
            throw new ForbiddenException("Insufficient role for this action.");

        }
        return m;
}