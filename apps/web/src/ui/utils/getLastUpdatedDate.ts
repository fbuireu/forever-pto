import type { Locale } from 'next-intl';

const LAST_UPDATED = new Date(2026, 2, 31);

export function getLastUpdatedDate(locale: Locale) {
  return LAST_UPDATED.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
