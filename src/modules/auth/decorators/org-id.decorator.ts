import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { unknown } from "zod";


export const OrgId = createParamDecorator((
    _data: unknown,  ctx:ExecutionContext)=>{
        const req = ctx.switchToHttp().getRequest();
        const orgId = req.headers["x-org-id"] as string | undefined;
        return orgId ?? null;
    
}
)