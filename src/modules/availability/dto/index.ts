import { z } from "zod";

const WeekdaySchema = z.number().int().min(0).max(6);
const MinutesSchema = z.number().int().min(0).max(24 * 60);
const SlotSizeSchema = z.number().int().min(5).max(180);


export const ListWeeklyRulesQuerySchema = z
  .object({
    serviceId: z.string().min(1),
    staffMemberId: z.string().min(1).optional(),
    weekday: WeekdaySchema.optional(),
  })
  .strict();

export const CreateWeeklyRuleSchema = z
  .object({
    serviceId: z.string().min(1),
    weekday: WeekdaySchema,
    startMin: MinutesSchema,
    endMin: MinutesSchema,
    slotSizeMin: SlotSizeSchema.optional().default(15),
    staffMemberId: z.string().min(1).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.endMin <= val.startMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endMin must be greater than startMin",
        path: ["endMin"],
      });
    }
  })
  .strict();

export const UpdateWeeklyRuleSchema = z
  .object({
    weekday: WeekdaySchema.optional(),
    startMin: MinutesSchema.optional(),
    endMin: MinutesSchema.optional(),
    slotSizeMin: SlotSizeSchema.optional(),
    staffMemberId: z.string().min(1).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (
      val.startMin !== undefined &&
      val.endMin !== undefined &&
      val.endMin <= val.startMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endMin must be greater than startMin",
        path: ["endMin"],
      });
    }
  })
  .strict();


export type ListWeeklyRulesQuery = z.infer<typeof ListWeeklyRulesQuerySchema>;
export type CreateWeeklyRuleInput = z.infer<typeof CreateWeeklyRuleSchema>;
export type UpdateWeeklyRuleInput = z.infer<typeof UpdateWeeklyRuleSchema>;