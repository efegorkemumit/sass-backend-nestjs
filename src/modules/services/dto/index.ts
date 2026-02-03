import { z } from "zod";


export const CreateServiceSchema = z
  .object({
    name: z.string().min(1).max(120),
    description: z.string().max(500).optional().nullable(),
    durationMin: z.number().int().min(5).max(24 * 60),
    priceCents: z.number().int().min(0).optional().nullable(),
    currency: z.string().min(1).max(8).optional().nullable().default("TRY"),
  })
  .strict();


export const UpdateServiceSchema = z
  .object({
    name: z.string().min(1).max(120),
    description: z.string().max(500).optional().nullable(),
    durationMin: z.number().int().min(5).max(24 * 60),
    priceCents: z.number().int().min(0).optional().nullable(),
    currency: z.string().min(1).max(8).optional().nullable().default("TRY"),
  })
  .strict();

export const ListServicesQuerySchema = z
  .object({
    status: z.enum(["ACTIVE", "DISABLED"]).optional(),
    q: z.string().max(120).optional(),
    take: z.coerce.number().int().min(1).max(100).optional().default(50),
    skip: z.coerce.number().int().min(0).max(10_000).optional().default(0),
  })
  .strict();

export type ListServicesQuery = z.infer<typeof ListServicesQuerySchema>;
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
