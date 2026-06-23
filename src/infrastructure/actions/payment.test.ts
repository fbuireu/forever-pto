import { ApiError } from '@infrastructure/api/errors';
import { PaymentError, PromoCodeError, PromoCodeErrors, ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const mockCreatePayment = vi.hoisted(() =>
  vi.fn<
    (
      params: unknown,
      ctx: unknown
    ) => Effect.Effect<
      { clientSecret: string; discountInfo: null | { finalAmount: number } },
      ValidationError | PaymentError | PromoCodeError
    >
  >()
);

const mockHeaders = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === 'user-agent') return 'test-agent';
      if (key === 'x-forwarded-for') return '1.2.3.4';
      return null;
    }),
  })
);

vi.mock('@application/use-cases/payment', () => ({
  createPayment: mockCreatePayment,
}));

vi.mock('@infrastructure/layers', () => ({
  ApplicationLayer: Layer.empty,
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return { ...actual, after: vi.fn() };
});

const { createPaymentAction } = await import('./payment');

const validInput = { amount: 9.99, email: 'user@example.com' };

describe('createPaymentAction', () => {
  it('returns success:true with clientSecret on success', async () => {
    mockCreatePayment.mockReturnValue(Effect.succeed({ clientSecret: 'pi_secret_abc', discountInfo: null }));
    const result = await createPaymentAction(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.clientSecret).toBe('pi_secret_abc');
      expect(result.discountInfo).toBeUndefined();
    }
  });

  it('maps non-null discountInfo to result', async () => {
    const discountInfo = { finalAmount: 7.99, originalAmount: 9.99, percentOff: 20, code: 'SAVE20' };
    mockCreatePayment.mockReturnValue(Effect.succeed({ clientSecret: 'pi_secret', discountInfo }));
    const result = await createPaymentAction(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.discountInfo).toEqual(discountInfo);
  });

  it('passes userAgent and ipAddress from headers to createPayment', async () => {
    mockCreatePayment.mockReturnValue(Effect.succeed({ clientSecret: 'pi_secret', discountInfo: null }));
    await createPaymentAction(validInput);
    expect(mockCreatePayment).toHaveBeenCalledWith(validInput, { userAgent: 'test-agent', ipAddress: '1.2.3.4' });
  });

  it('returns success:false with message on ValidationError', async () => {
    mockCreatePayment.mockReturnValue(Effect.fail(new ValidationError({ message: 'Amount is required' })));
    const result = await createPaymentAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Amount is required');
  });

  it('returns success:false with code and isPromoCodeError on PromoCodeError', async () => {
    mockCreatePayment.mockReturnValue(Effect.fail(new PromoCodeError({ code: PromoCodeErrors.INVALID_OR_EXPIRED })));
    const result = await createPaymentAction({ ...validInput, promoCode: 'NOPE' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(PromoCodeErrors.INVALID_OR_EXPIRED);
      expect(result.isPromoCodeError).toBe(true);
    }
  });

  it('returns success:false with message on PaymentError', async () => {
    mockCreatePayment.mockReturnValue(Effect.fail(new PaymentError({ message: 'Stripe declined' })));
    const result = await createPaymentAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Stripe declined');
  });

  it('returns success:false with INTERNAL_ERROR on unexpected error', async () => {
    mockCreatePayment.mockReturnValue(
      Effect.fail(new Error('boom')) as unknown as Effect.Effect<
        { clientSecret: string; discountInfo: null },
        ValidationError | PaymentError | PromoCodeError
      >
    );
    const result = await createPaymentAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe(ApiError.INTERNAL_ERROR);
  });
});
