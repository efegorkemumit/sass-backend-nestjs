import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {  CreateWeeklyRuleSchema, ListWeeklyRulesQuerySchema, UpdateWeeklyRuleSchema } from './dto';
import type{ CreateWeeklyRuleInput, ListWeeklyRulesQuery, UpdateWeeklyRuleInput } from './dto';


@Controller('availability')
export class AvailabilityController {
      constructor(private readonly availability:AvailabilityService){}
    
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

        @Get("weekly-rules")
        @Roles("OWNER", "ADMIN", "STAFF")
        listWeeklyRules(
            @CurrentUser() user: JwtUser | null,
            @Headers("x-org-id") xOrgId: string | undefined,
            @Query(new ZodValidationPipe(ListWeeklyRulesQuerySchema)) query: ListWeeklyRulesQuery
        ) {
            const userId = this.requireUserId(user);
            const orgId = this.requireOrgId(xOrgId);
            return this.availability.listWeeklyRules(userId, orgId, query);
        }

        @Post("weekly-rules")
        @Roles("OWNER", "ADMIN")
        createWeeklyRule(
            @CurrentUser() user: JwtUser | null,
            @Headers("x-org-id") xOrgId: string | undefined,
            @Body(new ZodValidationPipe(CreateWeeklyRuleSchema)) dto: CreateWeeklyRuleInput
        ) {
            const userId = this.requireUserId(user);
            const orgId = this.requireOrgId(xOrgId);
            return this.availability.createWeeklyRule(userId, orgId, dto);
        }

        @Patch("weekly-rules/:id")
        @Roles("OWNER", "ADMIN")
        updateWeeklyRule(
            @CurrentUser() user: JwtUser | null,
            @Headers("x-org-id") xOrgId: string | undefined,
            @Param("id") ruleId: string,
            @Body(new ZodValidationPipe(UpdateWeeklyRuleSchema)) dto: UpdateWeeklyRuleInput
        ) {
            const userId = this.requireUserId(user);
            const orgId = this.requireOrgId(xOrgId);
            return this.availability.updateWeeklyRule(userId, orgId, ruleId, dto);
        }

        @Delete("weekly-rules/:id")
        @Roles("OWNER", "ADMIN")
        deleteWeeklyRule(
            @CurrentUser() user: JwtUser | null,
            @Headers("x-org-id") xOrgId: string | undefined,
            @Param("id") ruleId: string,
        ) {
            const userId = this.requireUserId(user);
            const orgId = this.requireOrgId(xOrgId);
            return this.availability.deleteWeeklyRule(userId, orgId, ruleId);
        }

}
