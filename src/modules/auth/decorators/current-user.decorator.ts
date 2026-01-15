import { createParamDecorator, ExecutionContext } from "@nestjs/common";


export type JwtUser = {
  userId: string;
  type: "access";
};


export const CurrentUser = createParamDecorator(
    (_data:unknown, ctx: ExecutionContext)=>{

        const req= ctx.switchToHttp().getRequest();

        return (req.user ?? null) as JwtUser | null;
    }
)