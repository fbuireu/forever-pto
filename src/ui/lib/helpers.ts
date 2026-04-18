import type { Locale } from 'next-intl';

export const ensureDate = (date: Date | string): Date => {
  if (typeof date === 'string') {
    return new Date(date);
  }
  return date instanceof Date ? date : new Date(date);
};

export const amountFormatter = (locale: Locale) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
