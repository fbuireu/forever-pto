import { describe, expect, it } from 'vitest';
import { createPaymentSchema, createPaymentSchemaWithMessages } from './schema';

const VALID = { amount: 9.99, email: 'user@example.com' };

describe('createPaymentSchema', () => {
  describe('valid input', () => {
    it('accepts a valid amount and email without promoCode', () => {
      expect(createPaymentSchema.safeParse(VALID).success).toBe(true);
    });

    it('accepts a valid promoCode when provided', () => {
      expect(createPaymentSchema.safeParse({ ...VALID, promoCode: 'SAVE10' }).success).toBe(true);
    });

    it('accepts an empty promoCode (optional field)', () => {
      expect(createPaymentSchema.safeParse({ ...VALID, promoCode: '' }).success).toBe(true);
    });

    it('accepts minimum valid amount (1)', () => {
      expect(createPaymentSchema.safeParse({ ...VALID, amount: 1 }).success).toBe(true);
    });

    it('accepts maximum valid amount (10000)', () => {
      expect(createPaymentSchema.safeParse({ ...VALID, amount: 10000 }).success).toBe(true);
    });
  });

  describe('amount validation', () => {
    it('rejects amount below minimum (0)', () => {
      const result = createPaymentSchema.safeParse({ ...VALID, amount: 0 });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('amount_too_low');
    });

    it('rejects amount above maximum (10001)', () => {
      const result = createPaymentSchema.safeParse({ ...VALID, amount: 10001 });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('amount_too_high');
    });

    it('rejects a non-numeric amount', () => {
      expect(createPaymentSchema.safeParse({ ...VALID, amount: 'ten' }).success).toBe(false);
    });

    it('rejects a missing amount', () => {
      const { amount: _, ...rest } = VALID;
      expect(createPaymentSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe('email validation', () => {
    it('rejects an invalid email format', () => {
      const result = createPaymentSchema.safeParse({ ...VALID, email: 'not-an-email' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe('invalid_email');
    });

    it('rejects a missing email', () => {
      const { email: _, ...rest } = VALID;
      expect(createPaymentSchema.safeParse(rest).success).toBe(false);
    });
  });
});

describe('createPaymentSchemaWithMessages', () => {
  const schema = createPaymentSchemaWithMessages({
    amountMin: 'Amount too small',
    amountMax: 'Amount too big',
    invalidEmail: 'Bad email',
    emailRequired: 'Email needed',
  });

  it('uses the provided amountMin message', () => {
    const result = schema.safeParse({ ...VALID, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Amount too small');
  });

  it('uses the provided amountMax message', () => {
    const result = schema.safeParse({ ...VALID, amount: 99999 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Amount too big');
  });

  it('uses the provided invalidEmail message', () => {
    const result = schema.safeParse({ ...VALID, email: 'bad' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Bad email');
  });
});
