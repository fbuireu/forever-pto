import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import { PaymentError, ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { createPayment } from './payment';

vi.mock('@application/shared/zodParse', () => ({
  zodParse: vi.fn((_, data) => Effect.succeed(data)),
}));

vi.mock('@application/dto/payment/dto', () => ({
  paymentDataDTO: { create: vi.fn().mockReturnValue({ id: 'pi_test' }) },
}));

vi.mock('@infrastructure/services/payments/provider/intent', () => ({
  createPaymentIntent: vi.fn(() =>
    Effect.succeed({ id: 'pi_test', client_secret: 'cs_test_secret' })
  ),
}));

vi.mock('@infrastructure/services/payments/provider/promo-code', () => ({
  validatePromoCode: vi.fn(() =>
    Effect.succeed({ finalAmount: 799, discountAmount: 200, promoCode: 'SAVE20' })
  ),
}));

vi.mock('@infrastructure/services/payments/repository', () => ({
  savePayment: vi.fn(() => Effect.succeed(undefined)),
  getPaymentById: vi.fn(() => Effect.succeed(undefined)),
  getPaymentByEmail: vi.fn(() => Effect.succeed(undefined)),
  updatePaymentStatus: vi.fn(() => Effect.succeed(undefined)),
}));

const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const TestLayer = Layer.mergeAll(
  Layer.succeed(LoggerService, mockLogger),
  Layer.succeed(TursoService, { query: vi.fn(), execute: vi.fn(), batch: vi.fn() }),
  Layer.succeed(StripeServerService, {
    paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
    charges: { retrieve: vi.fn() },
    promotionCodes: { list: vi.fn(), retrieve: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
  })
);

type PaymentR = LoggerService | TursoService | StripeServerService;
const run = <A, E>(eff: Effect.Effect<A, E, PaymentR>) =>
  Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));
const runFail = <A, E>(eff: Effect.Effect<A, E, PaymentR>) =>
  Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(TestLayer)));

const PARAMS = { amount: 999, email: 'buyer@example.com', promoCode: undefined };
const CONTEXT = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

beforeEach(() => vi.clearAllMocks());

describe('createPayment', () => {
  it('resolves with clientSecret on success', async () => {
    const result = await run(createPayment(PARAMS, CONTEXT));
    expect(result.clientSecret).toBe('cs_test_secret');
  });

  it('resolves with null discountInfo when no promo code', async () => {
    const result = await run(createPayment(PARAMS, CONTEXT));
    expect(result.discountInfo).toBeNull();
  });

  it('does not call validatePromoCode when promoCode is empty', async () => {
    const { validatePromoCode } = await import('@infrastructure/services/payments/provider/promo-code');
    await run(createPayment({ ...PARAMS, promoCode: '' }, CONTEXT));
    expect(validatePromoCode).not.toHaveBeenCalled();
  });

  it('applies promo code discount when promoCode is provided', async () => {
    const { validatePromoCode } = await import('@infrastructure/services/payments/provider/promo-code');
    const { createPaymentIntent } = await import('@infrastructure/services/payments/provider/intent');
    await run(createPayment({ ...PARAMS, promoCode: 'SAVE20' }, CONTEXT));
    expect(validatePromoCode).toHaveBeenCalledWith('SAVE20', 999);
    expect(createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({ amount: 799 }));
  });

  it('returns discountInfo when promo code is applied', async () => {
    const result = await run(createPayment({ ...PARAMS, promoCode: 'SAVE20' }, CONTEXT));
    expect(result.discountInfo).not.toBeNull();
  });

  it('fails with ValidationError when zodParse fails', async () => {
    const { zodParse } = await import('@application/shared/zodParse');
    vi.mocked(zodParse).mockReturnValueOnce(Effect.fail(new ValidationError({ message: 'invalid input' })));
    const err = await runFail(createPayment(PARAMS, CONTEXT));
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('fails with PaymentError when createPaymentIntent fails', async () => {
    const { createPaymentIntent } = await import('@infrastructure/services/payments/provider/intent');
    vi.mocked(createPaymentIntent).mockReturnValueOnce(
      Effect.fail(new PaymentError({ message: 'Stripe error' }))
    );
    const err = await runFail(createPayment(PARAMS, CONTEXT));
    expect(err).toBeInstanceOf(PaymentError);
  });

  it('fails with PaymentError when client_secret is missing', async () => {
    const { createPaymentIntent } = await import('@infrastructure/services/payments/provider/intent');
    vi.mocked(createPaymentIntent).mockReturnValueOnce(
      Effect.succeed({ id: 'pi_test', client_secret: null } as never)
    );
    const err = await runFail(createPayment(PARAMS, CONTEXT));
    expect(err).toBeInstanceOf(PaymentError);
  });

  it('resolves even when savePayment fails', async () => {
    const { savePayment } = await import('@infrastructure/services/payments/repository');
    vi.mocked(savePayment).mockReturnValueOnce(
      Effect.fail({ _tag: 'DatabaseError', message: 'db error' } as never)
    );
    const result = await run(createPayment(PARAMS, CONTEXT));
    expect(result.clientSecret).toBe('cs_test_secret');
    expect(mockLogger.warn).toHaveBeenCalledOnce();
  });
});
