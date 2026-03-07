import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { getLang } from '../utils/lang.util';
import { t } from 'src/i18n';

@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(I18nExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const lang = getLang(host);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: any = {
      message: 'INTERNAL_ERROR',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (status >= 500) {
        this.logger.error(`[${status}] ${exception.message}`, exception.stack, 'ExceptionFilter');
      } else {
        this.logger.warn(`[${status}] ${exception.message}`, 'ExceptionFilter');
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack, 'ExceptionFilter');
    } else {
      this.logger.error(JSON.stringify(exception), undefined, 'ExceptionFilter');
    }

    if ((exception as any)?.cause) {
      this.logger.error('Caused by:', (exception as any).cause, 'ExceptionFilter');
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;

      if (typeof res === 'string') {
        payload.message = t(res, lang);
      } else if (Array.isArray(res?.message)) {
        payload.message = res.message.map((m: string) => t(m, lang));
      } else if (typeof res === 'object') {
        payload = { ...res };
        if (res.message) payload.message = t(res.message, lang);
      }
    }

    response.status(status).json(payload);
  }
}
