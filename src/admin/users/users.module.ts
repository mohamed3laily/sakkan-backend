import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepo } from './users.repo';
import { DrizzleModule } from 'src/modules/db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepo],
})
export class UsersModule {}
