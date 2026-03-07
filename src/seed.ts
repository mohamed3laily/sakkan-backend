import { NestFactory } from '@nestjs/core';
import { DrizzleModule } from './modules/db/drizzle.module';
import { CitiesAreasSeed } from './modules/db/seed/cities-areas.seed';
import { PropertyTypeSeed } from './modules/db/seed/property-type.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DrizzleModule);

  const citiesAreasSeed = app.get(CitiesAreasSeed);
  await citiesAreasSeed.run();

  const propertyTypeSeed = app.get(PropertyTypeSeed);
  await propertyTypeSeed.run();

  await app.close();
}

bootstrap();
