import type { Locale } from 'next-intl';

const amountFormatterCache = new Map<string, Intl.NumberFormat>();

export const amountFormatter = (locale: Locale) => {
  let formatter = amountFormatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    amountFormatterCache.set(locale, formatter);
  }
  return formatter;
};

interface GetCurrencySymbolParams {
  locale: string;
  currency: string;
}

const currencySymbolCache = new Map<string, Intl.NumberFormat>();

export const getCurrencySymbol = ({ locale, currency }: GetCurrencySymbolParams): string => {
  try {
    const key = `${locale}-${currency}`;
    let formatter = currencySymbolCache.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      currencySymbolCache.set(key, formatter);
    }
    return formatter.formatToParts(0).find(({ type }) => type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
};
