import { ca, enUS, es, it, type Locale } from 'date-fns/locale';

export type LocaleKey = keyof typeof DATE_FNS_LOCALES;

export const DATE_FNS_LOCALES = {
  en: enUS,
  es: es,
  ca: ca,
  it: it,
} as const;

export function getLocalizedDateFns(locale: LocaleKey = 'en'): Locale {
  return DATE_FNS_LOCALES[locale];
}
