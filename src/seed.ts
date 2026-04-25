import { NestFactory } from '@nestjs/core';
import { DrizzleModule } from './modules/db/drizzle.module';
import { CitiesAreasSeed } from './modules/db/seed/cities-areas.seed';
import { AppSettingsSeed } from './modules/db/seed/app-settings.seed';
import { CreditProductsSeed } from './modules/db/seed/credit-products.seed';
import { SubscriptionPlansSeed } from './modules/db/seed/subscription-plans.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DrizzleModule);

  // Commented out seeding of cities/areas and subscription plans:
  // const citiesAreasSeed = app.get(CitiesAreasSeed);
  // await citiesAreasSeed.run();

  // const subscriptionPlansSeed = app.get(SubscriptionPlansSeed);
  // await subscriptionPlansSeed.run();

  //const creditProductsSeed = app.get(CreditProductsSeed);
  //await creditProductsSeed.run();

  const appSettingsSeed = app.get(AppSettingsSeed);
  await appSettingsSeed.run();

  await app.close();
}

void bootstrap();
