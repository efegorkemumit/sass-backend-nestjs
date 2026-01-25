import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { logger } from './common/logger';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { Roles } from './modules/auth/decorators/roles.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,

  
  ) {}

  @Get()
  getHello(): string {
    logger("test")
    return this.appService.getHello();
  }

  @Get("config")
    config(){
      return{
        nodeEnv:process.env.NODE_ENV,
        port: process.env.PORT,
        dbHostShown: process.env.NODE_ENV === "development",
      }
    }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "ADMIN")
  @Get("admin-only")
  adminOnly(){
    return { ok:true, scope: "Owner| Admin"}
  }

  
}
