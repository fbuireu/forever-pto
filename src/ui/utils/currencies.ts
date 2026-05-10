import type { Locale } from 'next-intl';

export const amountFormatter = (locale: Locale) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

interface GetCurrencySymbolParams {
  locale: string;
  currency: string;
}

export const getCurrencySymbol = ({ locale, currency }: GetCurrencySymbolParams): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.formatToParts(0).find(({ type }) => type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
};
