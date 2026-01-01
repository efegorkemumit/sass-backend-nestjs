import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { logger } from './common/logger';
import { UsersService } from './user.service';
import { PostsService } from './post.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UsersService,
    private readonly postService: PostsService,

  
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

  @Get("users")
   async getUsers(){
    return this.userService.users({});
   }

  @Get("posts")
   async getposts(){
    return this.postService.posts({});
   }
}
