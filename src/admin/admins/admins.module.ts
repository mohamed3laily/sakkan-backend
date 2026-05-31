import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/modules/db/drizzle.module';
import { AuthModule } from '../auth/auth.module';
import { AdminsController } from './admins.controller';
import { AdminsRepo } from './admins.repo';
import { AdminsService } from './admins.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [AdminsController],
  providers: [AdminsService, AdminsRepo],
})
export class AdminsModule {}
