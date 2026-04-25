import { Global, Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';
import { CitiesAreasSeed } from './seed/cities-areas.seed';
import { ConfigModule } from '@nestjs/config';
import { AppSettingsSeed } from './seed/app-settings.seed';
import { CreditProductsSeed } from './seed/credit-products.seed';
import { PropertyTypeSeed } from './seed/property-type.seed';
import { SubscriptionPlansSeed } from './seed/subscription-plans.seed';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    DrizzleService,
    CitiesAreasSeed,
    PropertyTypeSeed,
    SubscriptionPlansSeed,
    CreditProductsSeed,
    AppSettingsSeed,
  ],
  exports: [DrizzleService],
})
export class DrizzleModule {}
