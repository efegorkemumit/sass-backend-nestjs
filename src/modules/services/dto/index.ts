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

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
