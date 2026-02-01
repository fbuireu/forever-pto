import type { Locale as DateFnsLocale } from 'date-fns';
import type { Locale } from 'next-intl';
import { ca, enUS, es, it } from 'date-fns/locale';

export type LocaleKey = keyof typeof DATE_FNS_LOCALES;

export const DATE_FNS_LOCALES = {
  en: enUS,
  es: es,
  ca: ca,
  it: it,
} as const;

export function getLocalizedDateFns(locale: Locale): DateFnsLocale {
  return DATE_FNS_LOCALES[locale as unknown as LocaleKey];
}
