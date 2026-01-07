
import { z } from "zod";

export const RegisterSchema = z.object({
    email:z.string().trim().toLowerCase().email(),
    password : z.string().min(6),
    username : z.string().trim().min(3).max(30).optional(),
    fullName : z.string().trim().min(3).max(80).optional(),

})


export const LoginSchema = z.object({
    email:z.string().trim().toLowerCase().email(),
    password : z.string().min(6),

})

export const RefreshSchema = z.object({
    refreshToken : z.string().min(10),

})

export const LogoutSchema = z.object({
    refreshToken : z.string().min(10),

})

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
