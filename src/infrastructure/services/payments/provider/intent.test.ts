import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import { PaymentError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createPaymentIntent } = await import('./intent');

const mockIntentsCreate = vi.fn();

const MockStripeLayer = Layer.succeed(StripeServerService, {
  paymentIntents: { create: mockIntentsCreate, retrieve: vi.fn() },
  charges: { retrieve: vi.fn() },
  promotionCodes: { list: vi.fn(), retrieve: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
});

const MOCK_INTENT = { id: 'pi_123', client_secret: 'pi_123_secret' };

const run = (params: Parameters<typeof createPaymentIntent>[0]) =>
  Effect.runPromise(createPaymentIntent(params).pipe(Effect.provide(MockStripeLayer)));

beforeEach(() => {
  vi.clearAllMocks();
  mockIntentsCreate.mockReturnValue(Effect.succeed(MOCK_INTENT));
});

describe('createPaymentIntent', () => {
  it('returns the payment intent from Stripe', async () => {
    const result = await run({ amount: 10, email: 'user@example.com', discountInfo: null });
    expect(result).toEqual(MOCK_INTENT);
  });

  it('converts amount to cents (multiplied by 100)', async () => {
    await run({ amount: 9.99, email: 'user@example.com', discountInfo: null });
    const [params] = mockIntentsCreate.mock.calls[0] as [Record<string, unknown>];
    expect(params.amount).toBe(999);
  });

  it('sets currency to eur', async () => {
    await run({ amount: 10, email: 'user@example.com', discountInfo: null });
    const [params] = mockIntentsCreate.mock.calls[0] as [Record<string, unknown>];
    expect(params.currency).toBe('eur');
  });

  it('sets receipt_email to the provided email', async () => {
    await run({ amount: 10, email: 'donor@test.com', discountInfo: null });
    const [params] = mockIntentsCreate.mock.calls[0] as [Record<string, unknown>];
    expect(params.receipt_email).toBe('donor@test.com');
  });

  it('includes promoCode and discount metadata when discountInfo is provided', async () => {
    await run({
      amount: 10,
      email: 'user@example.com',
      promoCode: 'SAVE10',
      discountInfo: {
        type: 'percent',
        value: 10,
        originalAmount: 10,
        finalAmount: 9,
        couponId: 'coup_abc',
        couponName: 'SAVE10',
      },
    });
    const [params] = mockIntentsCreate.mock.calls[0] as [{ metadata: Record<string, unknown> }];
    expect(params.metadata.couponId).toBe('coup_abc');
    expect(params.metadata.discountType).toBe('percent');
    expect(params.metadata.discountValue).toBe('10');
  });

  it('does not include coupon metadata when discountInfo is null', async () => {
    await run({ amount: 10, email: 'user@example.com', discountInfo: null });
    const [params] = mockIntentsCreate.mock.calls[0] as [{ metadata: Record<string, unknown> }];
    expect(params.metadata.couponId).toBeUndefined();
  });

  it('includes userAgent and ipAddress in metadata', async () => {
    await run({
      amount: 10,
      email: 'user@example.com',
      discountInfo: null,
      userAgent: 'Mozilla/5.0',
      ipAddress: '1.2.3.4',
    });
    const [params] = mockIntentsCreate.mock.calls[0] as [{ metadata: Record<string, unknown> }];
    expect(params.metadata.userAgent).toBe('Mozilla/5.0');
    expect(params.metadata.ipAddress).toBe('1.2.3.4');
  });

  it('propagates PaymentError when Stripe fails', async () => {
    mockIntentsCreate.mockReturnValue(Effect.fail(new PaymentError({ message: 'Stripe error' })));
    const error = await Effect.runPromise(
      createPaymentIntent({ amount: 10, email: 'user@example.com', discountInfo: null }).pipe(
        Effect.provide(MockStripeLayer),
        Effect.flip
      )
    );
    expect(error).toBeInstanceOf(PaymentError);
  });
});
