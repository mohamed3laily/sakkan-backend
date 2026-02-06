import { NestFactory } from '@nestjs/core';
import { DrizzleModule } from './modules/db/drizzle.module';
import { CitiesAreasSeed } from './modules/db/seed/cities-areas.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DrizzleModule);

  const seed = app.get(CitiesAreasSeed);
  await seed.run();

  await app.close();
}

bootstrap();
