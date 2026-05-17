import { describe, expect, it } from 'vitest';
import { DEFAULT_CURRENCY, amountFormatter, getCurrencyForLocale, getCurrencySymbol } from './currencies';

describe('getCurrencyForLocale', () => {
  it('returns DEFAULT_CURRENCY as the currency code', () => {
    const { currency } = getCurrencyForLocale('en-US');
    expect(currency).toBe(DEFAULT_CURRENCY);
  });

  it('returns the euro symbol', () => {
    const { currencySymbol } = getCurrencyForLocale('en-US');
    expect(currencySymbol).toBe('€');
  });

  it('returns the same object reference on repeated calls (cached)', () => {
    const first = getCurrencyForLocale('de-DE');
    const second = getCurrencyForLocale('de-DE');
    expect(first).toEqual(second);
  });
});

describe('amountFormatter', () => {
  it('returns an Intl.NumberFormat instance', () => {
    expect(amountFormatter('en-US')).toBeInstanceOf(Intl.NumberFormat);
  });

  it('formats a number as EUR currency', () => {
    const result = amountFormatter('en-US').format(1500);
    expect(result).toContain('1,500');
  });

  it('uses no decimal places', () => {
    const result = amountFormatter('en-US').format(99.99);
    expect(result).not.toContain('.');
  });

  it('returns the same formatter instance on repeated calls (cached)', () => {
    const first = amountFormatter('fr-FR');
    const second = amountFormatter('fr-FR');
    expect(first).toBe(second);
  });
});

describe('getCurrencySymbol', () => {
  it('returns the symbol for USD', () => {
    expect(getCurrencySymbol({ locale: 'en-US', currency: 'USD' })).toBe('$');
  });

  it('returns the symbol for EUR', () => {
    expect(getCurrencySymbol({ locale: 'de-DE', currency: 'EUR' })).toBe('€');
  });

  it('returns the symbol for GBP', () => {
    expect(getCurrencySymbol({ locale: 'en-GB', currency: 'GBP' })).toBe('£');
  });

  it('returns the same value on repeated calls (cached)', () => {
    const first = getCurrencySymbol({ locale: 'en-US', currency: 'USD' });
    const second = getCurrencySymbol({ locale: 'en-US', currency: 'USD' });
    expect(first).toBe(second);
  });

  it('returns currency code as fallback for invalid currency', () => {
    expect(getCurrencySymbol({ locale: 'en-US', currency: 'INVALID' })).toBe('INVALID');
  });
});
