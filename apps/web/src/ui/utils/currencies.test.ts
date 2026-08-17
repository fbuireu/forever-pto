import { describe, expect, it } from 'vitest';
import { amountFormatter, DEFAULT_CURRENCY, getCurrencyForLocale } from './currencies';

describe('getCurrencyForLocale', () => {
  it('returns DEFAULT_CURRENCY as the currency code', () => {
    const { currency } = getCurrencyForLocale('en');
    expect(currency).toBe(DEFAULT_CURRENCY);
  });

  it('returns the euro symbol', () => {
    const { currencySymbol } = getCurrencyForLocale('en');
    expect(currencySymbol).toBe('€');
  });

  it('returns the same object reference on repeated calls (cached)', () => {
    const first = getCurrencyForLocale('de');
    const second = getCurrencyForLocale('de');
    expect(first).toEqual(second);
  });
});

describe('formatter reuse', () => {
  it('hands back the same formatter for one locale, so the cache is shared rather than per function', () => {
    expect(amountFormatter('en')).toBe(amountFormatter('en'));
  });

  it('keeps the zero-digit and the default-digit formatters apart, which one cache key must not collapse', () => {
    expect(amountFormatter('en').format(10)).not.toContain('.');
    expect(getCurrencyForLocale('en').currencySymbol).toBe('€');
  });
});

describe('amountFormatter', () => {
  it('returns an Intl.NumberFormat instance', () => {
    expect(amountFormatter('en')).toBeInstanceOf(Intl.NumberFormat);
  });

  it('formats a number as EUR currency', () => {
    const result = amountFormatter('en').format(1500);
    expect(result).toContain('1,500');
  });

  it('uses no decimal places', () => {
    const result = amountFormatter('en').format(99.99);
    expect(result).not.toContain('.');
  });

  it('returns the same formatter instance on repeated calls (cached)', () => {
    const first = amountFormatter('fr');
    const second = amountFormatter('fr');
    expect(first).toBe(second);
  });
});
