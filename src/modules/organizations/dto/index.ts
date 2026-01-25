import { z } from "zod";

export const CreateOrganizationSchema= z.object({
     name: z.string().trim().min(2).max(80),
     slug: z.string().trim().min(2).max(80).optional(),
     timezone: z.string().trim().min(2).max(80).optional(),

})

export const ListOrganizationsQuerySchema = z.object({
    isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
})

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type ListOrganizationsQuery = z.infer<typeof ListOrganizationsQuerySchema>;
