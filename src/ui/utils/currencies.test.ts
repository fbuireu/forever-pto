import { describe, expect, it } from 'vitest';
import { amountFormatter, getCurrencySymbol } from './currencies';

describe('amountFormatter', () => {
  it('formats a number as EUR currency', () => {
    const result = amountFormatter('en-US').format(1500);
    expect(result).toContain('1,500');
  });

  it('uses no decimal places', () => {
    const result = amountFormatter('en-US').format(99.99);
    expect(result).not.toContain('.');
  });
});

describe('getCurrencySymbol', () => {
  it('returns the symbol for USD', () => {
    const symbol = getCurrencySymbol({ locale: 'en-US', currency: 'USD' });
    expect(symbol).toBe('$');
  });

  it('returns the symbol for EUR', () => {
    const symbol = getCurrencySymbol({ locale: 'de-DE', currency: 'EUR' });
    expect(symbol).toBe('€');
  });

  it('returns currency code as fallback for invalid currency', () => {
    const symbol = getCurrencySymbol({ locale: 'en-US', currency: 'INVALID' });
    expect(symbol).toBe('INVALID');
  });
});
