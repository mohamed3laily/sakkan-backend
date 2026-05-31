import { Module } from '@nestjs/common';

import { AuthModule } from 'src/modules/auth/auth.module';
import { DrizzleModule } from 'src/modules/db/drizzle.module';
import { UserSubscriptionsController } from './user-subscriptions.controller';
import { UserSubscriptionsRepo } from './user-subscriptions.repo';
import { UserSubscriptionsService } from './user-subscriptions.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [UserSubscriptionsController],
  providers: [UserSubscriptionsService, UserSubscriptionsRepo],
})
export class UserSubscriptionsModule {}
