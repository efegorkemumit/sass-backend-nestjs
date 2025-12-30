import { z } from "zod";

export const envSchema= z.object({
    PORT:z.coerce.number().int().positive().default(5000),
    NODE_ENV:z.enum(["development", "production", "test"]).default("development"),
    JWT_SECRET:z.string().min(10,"JWT_SECRET must be at least 10 characters long"),
    DATABASE_URL:z.string().min(1, "DATABASE_URL required")
})

export type Env = z.infer<typeof envSchema>;