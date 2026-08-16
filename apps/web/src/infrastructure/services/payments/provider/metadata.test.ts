import { describe, expect, it } from 'vitest';
import type StripeNode from 'stripe';
import { clampMetadata, readDonationMetadata } from './metadata';

const intent = (metadata: Record<string, string>, receiptEmail: string | null = null) =>
  ({ metadata, receipt_email: receiptEmail }) as unknown as StripeNode.PaymentIntent;

describe('readDonationMetadata', () => {
  it.each([
    ['metadata wins when both are present', { email: 'meta@example.com' }, 'receipt@example.com', 'meta@example.com'],
    ['falls back to receipt_email', {}, 'receipt@example.com', 'receipt@example.com'],
    ['trims before deciding', { email: '  meta@example.com  ' }, null, 'meta@example.com'],
    ['a blank metadata email is not an address', { email: '   ' }, 'receipt@example.com', 'receipt@example.com'],
    ['an empty metadata email is not an address', { email: '' }, 'receipt@example.com', 'receipt@example.com'],
  ])('%s', (_, metadata, receiptEmail, expected) => {
    expect(readDonationMetadata(intent(metadata, receiptEmail)).email).toBe(expected);
  });

  it('reports no address when neither yields one', () => {
    expect(readDonationMetadata(intent({ email: '  ' }, null)).email).toBeUndefined();
  });

  it('normalises the three optional fields to null rather than undefined', () => {
    expect(readDonationMetadata(intent({ email: 'a@b.com' }))).toEqual({
      email: 'a@b.com',
      promoCode: null,
      userAgent: null,
      ipAddress: null,
    });
  });

  it('carries the three optional fields through when present', () => {
    const metadata = { email: 'a@b.com', promoCode: 'SUMMER', userAgent: 'Firefox', ipAddress: '1.2.3.4' };
    expect(readDonationMetadata(intent(metadata))).toEqual({
      email: 'a@b.com',
      promoCode: 'SUMMER',
      userAgent: 'Firefox',
      ipAddress: '1.2.3.4',
    });
  });
});

describe('clampMetadata', () => {
  it('cuts a value at the 500 characters Stripe accepts', () => {
    expect(clampMetadata('x'.repeat(600))).toHaveLength(500);
  });

  it('turns an absent value into the empty string Stripe requires', () => {
    expect(clampMetadata(undefined)).toBe('');
    expect(clampMetadata(null)).toBe('');
  });
});
