import * as arCommon from './ar/common.json';
import * as arAuth from './ar/auth.json';
import * as arErrors from './ar/errors.json';
import * as arListing from './ar/listing.json';

import * as enCommon from './en/common.json';
import * as enAuth from './en/auth.json';
import * as enErrors from './en/errors.json';
import * as enListing from './en/listing.json';

export const i18n = {
  ar: {
    ...arCommon,
    ...arAuth,
    ...arErrors,
    ...arListing,
  },
  en: {
    ...enCommon,
    ...enAuth,
    ...enErrors,
    ...enListing,
  },
};

export type Lang = keyof typeof i18n;

export function t(key: string, lang: Lang = 'en'): string {
  return i18n[lang]?.[key] || key;
}
