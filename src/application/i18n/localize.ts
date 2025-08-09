import { ca, enUS, es, it } from 'date-fns/locale';
import type { Locale } from 'next-intl';

export type LocaleKey = keyof typeof DATE_FNS_LOCALES;

export const DATE_FNS_LOCALES = {
  en: enUS,
  es: es,
  ca: ca,
  it: it,
} as const;

export function getLocalizedDateFns(locale: LocaleKey = 'en'): Locale {
  return DATE_FNS_LOCALES[locale] as unknown as Locale;
}
