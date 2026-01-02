import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type {  RegisterInput } from './dto';
import {  RegisterSchema } from './dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth : AuthService){}

    @Post("register")
    @UsePipes(new ZodValidationPipe(RegisterSchema))
    register(@Body() dto: RegisterInput){
        return this.auth.register(dto);
    }

}
