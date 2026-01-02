import { z } from "zod";

export const envSchema= z.object({
    PORT:z.coerce.number().int().positive().default(5000),
    NODE_ENV:z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL:z.string().min(1, "DATABASE_URL required"),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_ACCESS_TTL: z.string().default("15m"),
    JWT_REFRESH_TTL: z.string().default("30d"),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).default(12),

})

export type Env = z.infer<typeof envSchema>;