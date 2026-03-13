import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepo } from './user.repo';
import { UserController } from './user.controller';

@Module({
  providers: [UserService, UserRepo],
  exports: [UserService, UserRepo],
  controllers: [UserController],
})
export class UserModule {}
