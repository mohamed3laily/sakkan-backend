import { NestFactory } from '@nestjs/core';
import { DrizzleModule } from './modules/db/drizzle.module';
import { CitiesAreasSeed } from './modules/db/seed/cities-areas.seed';
import { SubscriptionPlansSeed } from './modules/db/seed/subscription-plans.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DrizzleModule);

  const citiesAreasSeed = app.get(CitiesAreasSeed);
  await citiesAreasSeed.run();

  const subscriptionPlansSeed = app.get(SubscriptionPlansSeed);
  await subscriptionPlansSeed.run();

  await app.close();
}

void bootstrap();
