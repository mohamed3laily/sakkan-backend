import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getLang } from '../utils/lang.util';
import { t } from 'src/i18n';

@Injectable()
export class ResponseTranslateInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const lang = getLang(context);
    return next.handle().pipe(
      map((data) => {
        if (!data) return data;
        if (data.message) {
          return {
            ...data,
            message: t(data.message, lang),
          };
        }
        return data;
      }),
    );
  }
}
