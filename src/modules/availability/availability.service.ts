import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, MembershipRole } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';
import { CreateWeeklyRuleInput, ListWeeklyRulesQuery, UpdateWeeklyRuleInput } from './dto';
import { requireOrgRole } from 'src/common/authz/org-authz';

@Injectable()
export class AvailabilityService {

    constructor(private readonly prisma:PrismaService){}

    private weeklyRuleSelect = {
        id: true,
        serviceId: true,
        weekday: true,
        startMin: true,
        endMin: true,
        slotSizeMin: true,
        staffMemberId: true,
        createdAt: true,
        updatedAt: true,
  };



      private async requireServiceInOrg(organizationId:string, serviceId:string){
          const s = await this.prisma.service.findFirst({
              where:{id:serviceId, organizationId},
              select:{id:true}
          });
  
          if(!s) throw new NotFoundException("Service not found.");
          return s;
      }
  
      private async requireStaffMembership(organizationId:string, memberId:string){
          const m=  await this.prisma.membership.findFirst({
              where:{id:memberId, organizationId},
              select:{id:true, role:true}
          })
  
          if(!m)  throw new NotFoundException("Membership not found.");
          if(m.role === MembershipRole.CUSTOMER){
               throw new BadRequestException("Only staff members can be assigned.");
          }
  
           return m;
      }

      private async requireWeeklyRuleInOrg(organizationId:string, ruleId:string){
          const r = await this.prisma.weeklyAvailabilityRule.findFirst({
              where:{id:ruleId, service:{organizationId}},
              select:this.weeklyRuleSelect
          });
  
          if(!r) throw new NotFoundException("Weekly rule not found.");
          return r;
      }
      


      async listWeeklyRules(userId:string, organizationId:string, query:ListWeeklyRulesQuery){
            await requireOrgRole(this.prisma, userId, organizationId, [
                MembershipRole.OWNER,
                MembershipRole.ADMIN,
                MembershipRole.STAFF,
            ]);

            await this.requireServiceInOrg(organizationId, query.serviceId)

            return this.prisma.weeklyAvailabilityRule.findMany({
                where:{
                    serviceId:query.serviceId,
                    ...(query.staffMemberId ? {staffMemberId : query.staffMemberId}: {}),
                    ...(query.weekday !==undefined ? {weekday: query.weekday} : {}),
                },
                orderBy:[{weekday:"asc"}, {startMin:"asc"}],
                select:this.weeklyRuleSelect,

            })

      }

      async createWeeklyRule(userId:string, organizationId:string, dto:CreateWeeklyRuleInput){
          await requireOrgRole(this.prisma, userId, organizationId, [
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
          ]);

          await this.requireServiceInOrg(organizationId, dto.serviceId);

          if(dto.staffMemberId){
            await this.requireStaffMembership(organizationId, dto.staffMemberId)
          }

          const created = await this.prisma.weeklyAvailabilityRule.create({
            data:{
                serviceId:dto.serviceId,
                weekday: dto.weekday,
                startMin: dto.startMin,
                endMin: dto.endMin,
                slotSizeMin: dto.slotSizeMin,
                staffMemberId: dto.staffMemberId ?? null,
            },
            select:this.weeklyRuleSelect

          })

          await this.prisma.auditLog.create({
            data: {
                action: AuditAction.CREATE,
                userId,
                organizationId,
                entity: "WeeklyAvailabilityRule",
                entityId: created.id,
                meta: {
                serviceId: created.serviceId,
                weekday: created.weekday,
                startMin: created.startMin,
                endMin: created.endMin,
                staffMemberId: created.staffMemberId,
                },
            },
        });

         return created;


      }


    async updateWeeklyRule(userId:string, organizationId:string, ruleId:string, dto:UpdateWeeklyRuleInput){

        await requireOrgRole(this.prisma, userId, organizationId, [
                MembershipRole.OWNER,
                MembershipRole.ADMIN,
        ]);

        await this.requireWeeklyRuleInOrg(organizationId, ruleId);

        if(dto.staffMemberId !== undefined && dto.staffMemberId){
            await this.requireStaffMembership(organizationId, dto.staffMemberId)
        }

        const data: any= {};
        if (dto.weekday !== undefined) data.weekday = dto.weekday;
        if (dto.startMin !== undefined) data.startMin = dto.startMin;
        if (dto.endMin !== undefined) data.endMin = dto.endMin;
        if (dto.slotSizeMin !== undefined) data.slotSizeMin = dto.slotSizeMin;
        if (dto.staffMemberId !== undefined) data.staffMemberId = dto.staffMemberId ?? null;

        if(Object.keys(data).length === 0 ){
             throw new BadRequestException("Nothing to update.");
        }

        const updated = await this.prisma.weeklyAvailabilityRule.update({
            where:{id:ruleId},
            data,
            select:this.weeklyRuleSelect
        })
        
        await this.prisma.auditLog.create({
            data: {
                action: AuditAction.UPDATE,
                userId,
                organizationId,
                entity: "WeeklyAvailabilityRule",
                entityId: updated.id,
                meta: { fields: Object.keys(data) },
            },
            });

     return updated;
    
    }

    async deleteWeeklyRule(userId:string, organizationId:string, ruleId:string){

        await requireOrgRole(this.prisma, userId, organizationId, [
        MembershipRole.OWNER,
        MembershipRole.ADMIN,
        ]);

        const existing = await this.requireWeeklyRuleInOrg(organizationId, ruleId);

        await this.prisma.weeklyAvailabilityRule.delete({
            where:{id:ruleId}
        })

        await this.prisma.auditLog.create({
            data: {
                action: AuditAction.DELETE,
                userId,
                organizationId,
                entity: "WeeklyAvailabilityRule",
                entityId: existing.id,
                meta: { serviceId: existing.serviceId },
            },
            });

        return { removed: true };
    }

}
