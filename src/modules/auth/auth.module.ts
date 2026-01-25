import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [ConfigModule, JwtModule.register({}), PassportModule.register({defaultStrategy:"jwt"})],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy, RolesGuard]
})
export class AuthModule {}
