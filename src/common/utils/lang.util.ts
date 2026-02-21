import { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { Lang } from 'src/i18n';

export function getLang(ctx: ExecutionContext | ArgumentsHost): Lang {
  const request =
    'switchToHttp' in ctx
      ? ctx.switchToHttp().getRequest()
      : (ctx as ArgumentsHost).switchToHttp().getRequest();

  return (
    request?.headers?.['accept-language']?.split(',')[0]?.split('-')[0] || 'en'
  );
}
