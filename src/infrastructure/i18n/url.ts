import { hasLocale } from 'next-intl';
import { LOCALES } from './locales';
import { routing } from './routing';

export function localePath(locale: string, path = ''): string {
  return locale === routing.defaultLocale ? path || '/' : `/${locale}${path}`;
}

export function getLocaleFromPathname(pathname: string): string {
  const segment = pathname.split('/')[1] ?? '';
  return hasLocale(LOCALES, segment) ? segment : routing.defaultLocale;
}

export function localeAlternates(path = ''): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
    'x-default': localePath(routing.defaultLocale, path),
  };
}
