
import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "../constans";


@Injectable()

export class JwtAuthGuard extends AuthGuard("jwt"){
    constructor(private readonly reflector: Reflector){
        super();
    }

    canActivate(context: ExecutionContext){
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY,[
            context.getHandler(),
            context.getClass()
        ])

        if(isPublic) return true;

        return super.canActivate(context) as any;
        
    }

    handleRequest(err:any, user:any, info?:any){

        if(err) throw err;

        if(!user){
            if(info?.name === "TokenExpiredError"){
                throw new UnauthorizedException("Access Token expired")
            }
            throw new UnauthorizedException("Unauthorized");
        }
        return user;
     

    }
}