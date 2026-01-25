import { SetMetadata } from "@nestjs/common";
import { ROLES_KEY } from "../constans";

export type AppRole = "OWNER" | "ADMIN" | "STAFF" | "CUSTOMER";

export const Roles = (...roles : AppRole[])=>SetMetadata(ROLES_KEY, roles)