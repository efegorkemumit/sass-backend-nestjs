import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {  CreateOrganizationSchema } from './dto';
import type { CreateOrganizationInput } from './dto';

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

}
