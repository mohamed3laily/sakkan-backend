import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TranslateInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const lang =
      request.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';

    return next.handle().pipe(map((data) => this.translate(data, lang)));
  }

  private translate(data: any, lang: string): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.translateItem(item, lang));
    }

    return this.translateItem(data, lang);
  }

  private translateItem(item: any, lang: string): any {
    if (!item || typeof item !== 'object') return item;

    const { nameEn, nameAr, ...rest } = item;

    if (nameEn || nameAr) {
      return {
        ...rest,
        name: lang === 'ar' ? nameAr : nameEn,
      };
    }

    // Recursively translate nested objects
    const translated: any = {};
    for (const key in item) {
      translated[key] = this.translate(item[key], lang);
    }

    return translated;
  }
}
