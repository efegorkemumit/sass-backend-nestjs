import { Body, Controller, Get, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {  CreateOrganizationSchema, ListOrganizationsQuerySchema } from './dto';
import type { CreateOrganizationInput, ListOrganizationsQuery } from './dto';

@Controller('organizations')
export class OrganizationsController {

    constructor(private readonly organizations: OrganizationsService){}

    private requireUserId(user:JwtUser | null):string{
        const userId = user?.userId?.toString().trim();
        if (!userId) throw new UnauthorizedException("Unauthorized");
        return userId;
    }

    @Post()
    create(
        @CurrentUser() user:JwtUser | null,
        @Body(new ZodValidationPipe(CreateOrganizationSchema))
        dto:CreateOrganizationInput
    ){
        if(!user) throw new UnauthorizedException("Unauthorized");
        return this.organizations.create(user.userId, dto)
    }

    @Get()
    listMine(
        @CurrentUser() user:JwtUser | null,
        @Query(new ZodValidationPipe(ListOrganizationsQuerySchema)) query: ListOrganizationsQuery
    ){
        if(!user)throw new UnauthorizedException("Unauthorized");
        return this.organizations.listMine(user.userId, query)
    }

    @Get(":id")
    getOne(@CurrentUser() user:JwtUser | null, @Param("id") organizationId:string){
        const userId = this.requireUserId(user);
        return this.organizations.getOne(userId, organizationId)
    }

}
