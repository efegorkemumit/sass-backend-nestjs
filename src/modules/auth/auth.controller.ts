import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type {  LoginInput, RefreshInput, RegisterInput } from './dto';
import {  LoginSchema, RefreshSchema, RegisterSchema } from './dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth : AuthService){}

    @Post("register")
    @UsePipes(new ZodValidationPipe(RegisterSchema))
    register(@Body() dto: RegisterInput){
        return this.auth.register(dto);
    }

    @Post("login")
    @UsePipes(new ZodValidationPipe(LoginSchema))
    login(@Body() dto: LoginInput){
        return this.auth.login(dto);
    }

    @Post("refresh")
    @UsePipes(new ZodValidationPipe(RefreshSchema))
    refresh(@Body() dto: RefreshInput){
        return this.auth.refresh(dto);
    }

}
