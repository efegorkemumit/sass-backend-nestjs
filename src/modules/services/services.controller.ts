import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { AddServiceStaffSchema, CreateServiceSchema, ListServicesQuerySchema, UpdateServiceSchema } from './dto';
import type{ AddServiceStaffInput, CreateServiceInput, ListServicesQuery, UpdateServiceInput } from './dto';

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


    // GET

    @Get()
    @Roles("OWNER", "ADMIN", "STAFF")
    list(
        @CurrentUser() user:JwtUser | null,
        @Headers("x-org-id") xOrgId:string | undefined,
        @Query(new ZodValidationPipe(ListServicesQuerySchema)) query:ListServicesQuery
    ){

        const userId = this.requireUserId(user);
        const orgId = this.requireOrgId(xOrgId);
        return this.services.list(userId, orgId, query)
    }

    @Get(":id")
    @Roles("OWNER", "ADMIN", "STAFF")
    getOne(
        @CurrentUser() user:JwtUser | null,
        @Headers("x-org-id") xOrgId:string | undefined,
        @Param("id") serviceId:string,
    ){

        const userId = this.requireUserId(user);
        const orgId = this.requireOrgId(xOrgId);
        return this.services.getOne(userId, orgId, serviceId)
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


    /////// Service Staff


    @Get(":id/staff")
    @Roles("OWNER", "ADMIN", "STAFF")
    listStaff(
        @CurrentUser() user:JwtUser | null,
        @Headers("x-org-id") xOrgId:string | undefined,
        @Param("id") serviceId:string,
    ){

        const userId = this.requireUserId(user);
        const orgId = this.requireOrgId(xOrgId);
        return this.services.listStaff(userId, orgId, serviceId)
    }

    @Post(":id/staff")
    @Roles("OWNER", "ADMIN")
    addStaff(
        @CurrentUser() user:JwtUser | null,
        @Headers("x-org-id") xOrgId:string | undefined,
        @Param("id") serviceId:string,
        @Body(new ZodValidationPipe(AddServiceStaffSchema)) dto:AddServiceStaffInput
    ){

        const userId = this.requireUserId(user);
        const orgId = this.requireOrgId(xOrgId);
        return this.services.addStaff(userId, orgId, serviceId, dto)
    }

    @Delete(":id/staff/:memberId")
    @Roles("OWNER", "ADMIN")
    removeStaff(
        @CurrentUser() user:JwtUser | null,
        @Headers("x-org-id") xOrgId:string | undefined,
        @Param("id") serviceId:string,
        @Param("memberId") memberId:string,

    ){

        const userId = this.requireUserId(user);
        const orgId = this.requireOrgId(xOrgId);
        return this.services.removeStaff(userId, orgId, serviceId, memberId)
    }



}
