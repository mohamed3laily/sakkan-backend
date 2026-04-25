import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type BilingualPair = { enKey: string; arKey: string; outKey: string };

const BILINGUAL_PAIRS: BilingualPair[] = [
  { enKey: 'nameEn', arKey: 'nameAr', outKey: 'name' },
  { enKey: 'displayNameEn', arKey: 'displayNameAr', outKey: 'displayName' },
  { enKey: 'planNameEn', arKey: 'planNameAr', outKey: 'planName' },
  {
    enKey: 'termsAndConditionsEn',
    arKey: 'termsAndConditionsAr',
    outKey: 'termsAndConditions',
  },
];

@Injectable()
export class TranslateInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const raw = request.headers?.['accept-language'];
    const header = Array.isArray(raw) ? raw[0] : raw;
    const lang = header?.split(',')[0]?.split('-')[0] || 'en';

    return next.handle().pipe(map((data) => this.translate(data, lang)));
  }

  private translate(data: unknown, lang: string): unknown {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.translateItem(item, lang));
    }

    return this.translateItem(data, lang);
  }

  private translateItem(item: unknown, lang: string): unknown {
    if (!item || typeof item !== 'object') return item;
    if (item instanceof Date) return item;

    const record = item as Record<string, unknown>;
    const working: Record<string, unknown> = { ...record };

    for (const { enKey, arKey, outKey } of BILINGUAL_PAIRS) {
      if (!(enKey in working) && !(arKey in working)) continue;
      const enVal = working[enKey];
      const arVal = working[arKey];
      delete working[enKey];
      delete working[arKey];
      working[outKey] = lang === 'ar' ? (arVal ?? enVal) : (enVal ?? arVal);
    }

    const translated: Record<string, unknown> = {};
    for (const key in working) {
      translated[key] = this.translate(working[key], lang);
    }
    return translated;
  }
}
