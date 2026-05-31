import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getLang } from '../utils/lang.util';
import { shouldSkipTranslation } from '../utils/skip-translation.util';
import { t } from 'src/i18n';

@Injectable()
export class ResponseTranslateInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (shouldSkipTranslation(context)) {
      return next.handle();
    }

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
