import { hasLocale } from 'next-intl';
import { LOCALES } from '../locales';
import { routing } from '../routing';

export function localePath(locale: string, path = '') {
  return locale === routing.defaultLocale ? path || '/' : `/${locale}${path}`;
}

export function getLocaleFromPathname(pathname: string) {
  const segment = pathname.split('/')[1] ?? '';
  return hasLocale(LOCALES, segment) ? segment : routing.defaultLocale;
}

export function routePathFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const withoutLocale = hasLocale(LOCALES, segments[0] ?? '') ? segments.slice(1) : segments;
  return withoutLocale.length ? `/${withoutLocale.join('/')}` : '';
}

export function localeAlternates(path = ''): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
    'x-default': localePath(routing.defaultLocale, path),
  };
}
