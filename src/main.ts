import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ResponseTranslateInterceptor } from './common/interceptors/response-translate.interceptor';
import { TranslateInterceptor } from './common/interceptors/translate.interceptor';
import { I18nExceptionFilter } from './common/filters/i18n-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  app.useGlobalInterceptors(
    new TranslateInterceptor(),
    new ResponseTranslateInterceptor(),
  );

  app.useGlobalFilters(new I18nExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
