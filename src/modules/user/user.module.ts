import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepo } from './user.repo';

@Module({
  providers: [UserService, UserRepo],
  exports: [UserService, UserRepo],
})
export class UserModule {}
