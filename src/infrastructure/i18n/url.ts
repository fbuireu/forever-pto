import { LOCALES } from './locales';
import { routing } from './routing';

export function localePath(locale: string, path = ''): string {
  return locale === routing.defaultLocale ? path || '/' : `/${locale}${path}`;
}

export function localeAlternates(path = ''): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
    'x-default': localePath(routing.defaultLocale, path),
  };
}
