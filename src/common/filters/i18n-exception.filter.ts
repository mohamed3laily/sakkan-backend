import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { getLang } from '../utils/lang.util';
import { t } from 'src/i18n';

@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const lang = getLang(host);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;

      if (typeof res === 'string') {
        message = res;
      } else if (Array.isArray(res?.message)) {
        message = res.message.map((m) => t(m, lang));
      } else {
        message = res?.message ?? message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message : t(message as string, lang),
    });
  }
}
