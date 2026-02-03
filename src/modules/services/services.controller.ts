import { Body, Controller, Headers, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CreateServiceSchema, UpdateServiceSchema } from './dto';
import type{ CreateServiceInput, UpdateServiceInput } from './dto';

@Controller('services')
export class ServicesController {

    constructor(private readonly services:ServicesService){}

    private requireUserId(user:JwtUser | null): string {
        const userId= user?.userId.toString().trim();
        if(!userId) throw new UnauthorizedException("Unauthorized");
        return userId;
    }

    private requireOrgId(xOrgId:string | undefined): string {
        const orgId= (xOrgId ?? "").toString().trim()
        if(!orgId) throw new UnauthorizedException("Missing OrgId");
        return orgId;
    }


    // POST

    @Post()
    @Roles("OWNER", "ADMIN")
    create(
        @CurrentUser() user:JwtUser | null,
        @Headers("x-org-id") xOrgId:string | undefined,
        @Body(new ZodValidationPipe(CreateServiceSchema)) dto:CreateServiceInput
    ){

        const userId = this.requireUserId(user);
        const orgId = this.requireOrgId(xOrgId);
        return this.services.create(userId, orgId, dto)
    }



    //// PATCH

    @Patch(":id")
    @Roles("OWNER", "ADMIN")
    update(
        @CurrentUser() user:JwtUser | null,
        @Headers("x-org-id") xOrgId:string | undefined,
        @Param("id") serviceId:string,
        @Body(new ZodValidationPipe(UpdateServiceSchema)) dto:UpdateServiceInput
    ){

        const userId = this.requireUserId(user);
        const orgId = this.requireOrgId(xOrgId);
        return this.services.update(userId, orgId, serviceId, dto)
    }


    @Patch(":id/disable")
    @Roles("OWNER", "ADMIN")
    disable(
        @CurrentUser() user:JwtUser | null,
        @Headers("x-org-id") xOrgId:string | undefined,
        @Param("id") serviceId:string,
    ){

        const userId = this.requireUserId(user);
        const orgId = this.requireOrgId(xOrgId);
        return this.services.setStatus(userId, orgId, serviceId, "DISABLED")
    }


    @Patch(":id/enable")
    @Roles("OWNER", "ADMIN")
    enable(
        @CurrentUser() user:JwtUser | null,
        @Headers("x-org-id") xOrgId:string | undefined,
        @Param("id") serviceId:string,
    ){

        const userId = this.requireUserId(user);
        const orgId = this.requireOrgId(xOrgId);
        return this.services.setStatus(userId, orgId, serviceId, "ACTIVE")
    }





}
