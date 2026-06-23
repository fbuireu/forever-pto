import { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import { ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activateWithEmail, activateWithPayment } from './activatePremium';

vi.mock('@application/dto/payment/dto', () => ({
  paymentDataDTO: { create: vi.fn().mockReturnValue({ id: 'pi_test', email: 'test@example.com' }) },
}));

vi.mock('@infrastructure/services/payments/repository', () => ({
  getPaymentById: vi.fn(() => Effect.succeed(undefined)),
  getPaymentByEmail: vi.fn(() => Effect.succeed(undefined)),
  savePayment: vi.fn(() => Effect.succeed(undefined)),
  updatePaymentStatus: vi.fn(() => Effect.succeed(undefined)),
}));

vi.mock('@infrastructure/services/premium/session', () => ({
  createSession: vi.fn(() => Effect.succeed('jwt-token')),
}));

const SUCCEEDED_INTENT = {
  id: 'pi_test',
  status: 'succeeded' as string,
  metadata: { email: 'test@example.com' },
  receipt_email: null,
};

const mockStripe = {
  paymentIntents: { retrieve: vi.fn(() => Effect.succeed(SUCCEEDED_INTENT) as never), create: vi.fn() },
  charges: { retrieve: vi.fn() },
  promotionCodes: { list: vi.fn(), retrieve: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
};

const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const TestLayer = Layer.mergeAll(
  Layer.succeed(LoggerService, mockLogger),
  Layer.succeed(TursoService, { query: vi.fn(), execute: vi.fn(), batch: vi.fn() }),
  Layer.succeed(StripeServerService, mockStripe)
);

type PremiumR = LoggerService | TursoService | StripeServerService;
const run = <A, E>(eff: Effect.Effect<A, E, PremiumR>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));
const runFail = <A, E>(eff: Effect.Effect<A, E, PremiumR>) =>
  Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(TestLayer)));
const runDeferred = (deferred: Effect.Effect<void, never, TursoService>) =>
  Effect.runPromise(deferred.pipe(Effect.provide(TestLayer)));

beforeEach(() => vi.clearAllMocks());

describe('activateWithPayment', () => {
  it('returns email, premiumKey and token on success', async () => {
    const result = await run(activateWithPayment('test@example.com', 'pi_test'));
    expect(result).toMatchObject({ email: 'test@example.com', premiumKey: 'pi_test', token: 'jwt-token' });
  });

  it('does not touch the payment record during the critical path', async () => {
    const { getPaymentById, savePayment } = await import('@infrastructure/services/payments/repository');
    await run(activateWithPayment('test@example.com', 'pi_test'));
    expect(getPaymentById).not.toHaveBeenCalled();
    expect(savePayment).not.toHaveBeenCalled();
  });

  it('saves payment when no existing record (deferred)', async () => {
    const { savePayment } = await import('@infrastructure/services/payments/repository');
    const { deferred } = await run(activateWithPayment('test@example.com', 'pi_test'));
    await runDeferred(deferred);
    expect(savePayment).toHaveBeenCalledOnce();
  });

  it('skips savePayment when payment already exists with succeeded status (deferred)', async () => {
    const { getPaymentById, savePayment } = await import('@infrastructure/services/payments/repository');
    vi.mocked(getPaymentById).mockReturnValueOnce(Effect.succeed({ id: 'pi_test', status: 'succeeded' } as never));
    const { deferred } = await run(activateWithPayment('test@example.com', 'pi_test'));
    await runDeferred(deferred);
    expect(savePayment).not.toHaveBeenCalled();
  });

  it('updates status when existing payment is not succeeded (deferred)', async () => {
    const { getPaymentById, savePayment, updatePaymentStatus } = await import(
      '@infrastructure/services/payments/repository'
    );
    vi.mocked(getPaymentById).mockReturnValueOnce(Effect.succeed({ id: 'pi_test', status: 'processing' } as never));
    const { deferred } = await run(activateWithPayment('test@example.com', 'pi_test'));
    await runDeferred(deferred);
    expect(updatePaymentStatus).toHaveBeenCalledWith('pi_test', 'succeeded');
    expect(savePayment).not.toHaveBeenCalled();
  });

  it('fails with ValidationError when payment intent is not succeeded', async () => {
    mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
      Effect.succeed({ ...SUCCEEDED_INTENT, status: 'requires_payment_method' }) as never
    );
    const err = await runFail(activateWithPayment('test@example.com', 'pi_test'));
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('fails with ValidationError on email mismatch', async () => {
    mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
      Effect.succeed({ ...SUCCEEDED_INTENT, metadata: { email: 'other@example.com' }, receipt_email: null }) as never
    );
    const err = await runFail(activateWithPayment('test@example.com', 'pi_test'));
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('accepts when metadata email matches the provided email', async () => {
    await expect(run(activateWithPayment('test@example.com', 'pi_test'))).resolves.toBeDefined();
  });
});

describe('activateWithEmail', () => {
  it('returns email, premiumKey and token on success', async () => {
    const { getPaymentByEmail } = await import('@infrastructure/services/payments/repository');
    vi.mocked(getPaymentByEmail).mockReturnValueOnce(Effect.succeed({ id: 'pi_found', status: 'succeeded' } as never));
    const result = await run(activateWithEmail('test@example.com'));
    expect(result).toMatchObject({ email: 'test@example.com', premiumKey: 'pi_found', token: 'jwt-token' });
  });

  it('fails with ValidationError when no payment found', async () => {
    const err = await runFail(activateWithEmail('test@example.com'));
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('fails with ValidationError when payment is not succeeded', async () => {
    const { getPaymentByEmail } = await import('@infrastructure/services/payments/repository');
    vi.mocked(getPaymentByEmail).mockReturnValueOnce(Effect.succeed({ id: 'pi_found', status: 'processing' } as never));
    const err = await runFail(activateWithEmail('test@example.com'));
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('calls createSession with the payment id', async () => {
    const { getPaymentByEmail } = await import('@infrastructure/services/payments/repository');
    const { createSession } = await import('@infrastructure/services/premium/session');
    vi.mocked(getPaymentByEmail).mockReturnValueOnce(Effect.succeed({ id: 'pi_found', status: 'succeeded' } as never));
    await run(activateWithEmail('test@example.com'));
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ paymentIntentId: 'pi_found' }));
  });
});
