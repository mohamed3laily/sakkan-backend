import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Lang = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const lang = request.headers['accept-language']
      ?.split(',')[0]
      ?.split('-')[0];
    return ['ar', 'en'].includes(lang) ? lang : 'en';
  },
);
