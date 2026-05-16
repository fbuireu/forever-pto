import type { Locale } from 'next-intl';

const CURRENCY_STYLE = 'currency' as const;
const localeFormatterCache = new Map<string, Intl.NumberFormat>();
export const DEFAULT_CURRENCY = 'EUR';
export const DEFAULT_CURRENCY_SYMBOL = '€';

export const getCurrencyForLocale = (locale: Locale) => {
  let formatter = localeFormatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: CURRENCY_STYLE, currency: DEFAULT_CURRENCY });
    localeFormatterCache.set(locale, formatter);
  }
  const currency = formatter.resolvedOptions().currency ?? DEFAULT_CURRENCY;
  const currencySymbol = formatter.formatToParts(0).find(({ type }) => type === CURRENCY_STYLE)?.value ?? currency;
  return { currency, currencySymbol };
};

const amountFormatterCache = new Map<string, Intl.NumberFormat>();

export const amountFormatter = (locale: Locale) => {
  let formatter = amountFormatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: CURRENCY_STYLE,
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

export const getCurrencySymbol = ({ locale, currency }: GetCurrencySymbolParams) => {
  try {
    const key = `${locale}-${currency}`;
    let formatter = currencySymbolCache.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        style: CURRENCY_STYLE,
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      currencySymbolCache.set(key, formatter);
    }
    return formatter.formatToParts(0).find(({ type }) => type === CURRENCY_STYLE)?.value ?? currency;
  } catch {
    return currency;
  }
};
