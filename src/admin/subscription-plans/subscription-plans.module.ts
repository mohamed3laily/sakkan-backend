import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/modules/db/drizzle.module';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SubscriptionPlansRepo } from './subscription-plans.repo';
import { SubscriptionPlansService } from './subscription-plans.service';

@Module({
  imports: [DrizzleModule],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService, SubscriptionPlansRepo],
})
export class SubscriptionPlansModule {}
