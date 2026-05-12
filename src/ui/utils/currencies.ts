import type { Locale } from 'next-intl';

const amountFormatterCache = new Map<string, Intl.NumberFormat>();

export const amountFormatter = (locale: Locale) => {
  if (!amountFormatterCache.has(locale)) {
    amountFormatterCache.set(
      locale,
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  }
  return amountFormatterCache.get(locale)!;
};

interface GetCurrencySymbolParams {
  locale: string;
  currency: string;
}

const currencySymbolCache = new Map<string, Intl.NumberFormat>();

export const getCurrencySymbol = ({ locale, currency }: GetCurrencySymbolParams): string => {
  try {
    const key = `${locale}-${currency}`;
    if (!currencySymbolCache.has(key)) {
      currencySymbolCache.set(
        key,
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      );
    }
    const formatter = currencySymbolCache.get(key)!;
    return formatter.formatToParts(0).find(({ type }) => type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
};
