import { Body, Controller, Get, Post, UseGuards, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type {  LoginInput, LogoutInput, RefreshInput, RegisterInput } from './dto';
import {  LoginSchema, LogoutSchema, RefreshSchema, RegisterSchema } from './dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type {  JwtUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth : AuthService){}

    @Public()
    @Get("public-ping")
    publicPing(){
        return {ok:true} 
    }

    @UseGuards(JwtAuthGuard)
    @Get("me")
    me(@CurrentUser() user: JwtUser){
        return {user};
    }

    @Public()
    @Post("register")
    @UsePipes(new ZodValidationPipe(RegisterSchema))
    register(@Body() dto: RegisterInput){
        return this.auth.register(dto);
    }

    @Public()
    @Post("login")
    @UsePipes(new ZodValidationPipe(LoginSchema))
    login(@Body() dto: LoginInput){
        return this.auth.login(dto);
    }

    @Public()
    @Post("refresh")
    @UsePipes(new ZodValidationPipe(RefreshSchema))
    refresh(@Body() dto: RefreshInput){
        return this.auth.refresh(dto);
    }

    @Post("logout")
    @UsePipes(new ZodValidationPipe(LogoutSchema))
    logout(@Body() dto: LogoutInput){
        return this.auth.logout(dto);
    }

}
