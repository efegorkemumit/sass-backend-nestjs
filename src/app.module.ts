import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.schema';
import { PrismaService } from './prisma.service';
import { UsersService } from './user.service';
import { PostsService } from './post.service';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal:true,
    validate:(env)=>envSchema.parse(env)
  })],
  controllers: [AppController],
  providers: [AppService, PrismaService, UsersService, PostsService],
})
export class AppModule {}
