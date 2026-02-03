import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CreateServiceSchema } from './dto';
import type{ CreateServiceInput } from './dto';

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


}
