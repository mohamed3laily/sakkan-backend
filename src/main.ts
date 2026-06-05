import { NestFactory, Reflector } from '@nestjs/core';
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
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new TranslateInterceptor(reflector),
    new ResponseTranslateInterceptor(reflector),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
