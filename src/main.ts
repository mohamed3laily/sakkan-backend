import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ResponseTranslateInterceptor } from './common/interceptors/response-translate.interceptor';
import { TranslateInterceptor } from './common/interceptors/translate.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet());

  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins?.length || !isProduction) {
    app.enableCors({
      origin: corsOrigins?.length ? corsOrigins : true,
      credentials: true,
    });
  }

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new TranslateInterceptor(), new ResponseTranslateInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
