
import { z } from "zod";

export const RegisterSchema = z.object({
    email:z.string().trim().toLowerCase().email(),
    password : z.string().min(6),
    username : z.string().trim().min(3).max(30).optional(),
    fullName : z.string().trim().min(3).max(80).optional(),

})

export type RegisterInput = z.infer<typeof RegisterSchema>;