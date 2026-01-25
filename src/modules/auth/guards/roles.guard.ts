import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MembershipRole } from "generated/prisma/enums";
import { PrismaService } from "src/prisma.service";
import { ROLES_KEY } from "../constans";

@Injectable()
export class RolesGuard implements CanActivate{

    constructor(
        private readonly reflector: Reflector,
        private readonly prisma : PrismaService,
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean>{
        const requiredRoles =
            this.reflector.getAllAndOverride<MembershipRole[]>(ROLES_KEY,
                [
                    context.getHandler(),
                    context.getClass(),
                ]
            )?? [];

        if(requiredRoles.length ===0) return true

        const req = context.switchToHttp().getRequest();

        const userId: string | undefined = req.user?.userId;
        if(!userId) throw new UnauthorizedException("Unauthorized")

        const orgId = (req.headers["x-org-id"] as string | undefined) ?? null
        if(!orgId) throw new UnauthorizedException("Missing OrgId")

        const membership = await this.prisma.membership.findUnique({
            where:{
                userId_organizationId:{
                    userId,
                    organizationId:orgId
                }
            },
            select:{id:true, role:true}
        });

        if(!membership) throw new ForbiddenException("Not a member of organization");

        if(!requiredRoles.includes(membership.role)){
            throw new ForbiddenException("Insufficent role")
        }

        req.membership ={
            id:membership.id,
            role:membership.role,
            organization:orgId
        };
        return true;

    }

}