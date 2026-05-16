import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import { DatabaseError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import type { PaymentSucceededEvent } from '../events/types';
import { handlePaymentSucceeded } from './payment-succeeded';

vi.mock('@infrastructure/services/payments/repository', () => ({
  getPaymentById: vi.fn(() => Effect.succeed({ id: 'pi_test', status: 'pending' })),
  updatePaymentStatus: vi.fn(() => Effect.succeed(undefined)),
  updatePaymentCharge: vi.fn(() => Effect.succeed(undefined)),
}));

vi.mock('@infrastructure/services/payments/provider/charge', () => ({
  retrieveCharge: vi.fn(() =>
    Effect.succeed({
      id: 'ch_test',
      receiptUrl: null,
      paymentMethodType: null,
      country: null,
      customerName: null,
      postalCode: null,
      city: null,
      state: null,
      paymentBrand: null,
      paymentLast4: null,
      feeAmount: null,
      netAmount: null,
    })
  ),
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

type R = LoggerService | TursoService | StripeServerService;
const run = <E>(eff: Effect.Effect<void, E, R>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));

const EVENT: PaymentSucceededEvent = {
  type: 'payment_succeeded',
  paymentId: 'pi_test',
  email: 'test@example.com',
  amount: 999,
  status: 'succeeded',
  latestChargeId: 'ch_test',
  promoCode: null,
  userAgent: null,
  ipAddress: null,
};

beforeEach(() => vi.clearAllMocks());

describe('handlePaymentSucceeded', () => {
  it('resolves without error when payment exists', async () => {
    await expect(run(handlePaymentSucceeded(EVENT))).resolves.toBeUndefined();
  });

  it('calls updatePaymentStatus when existing payment is not succeeded', async () => {
    const { updatePaymentStatus } = await import('@infrastructure/services/payments/repository');
    await run(handlePaymentSucceeded(EVENT));
    expect(updatePaymentStatus).toHaveBeenCalledWith('pi_test', 'succeeded');
  });

  it('does not call updatePaymentStatus when existing payment is already succeeded', async () => {
    const { getPaymentById, updatePaymentStatus } = await import('@infrastructure/services/payments/repository');
    vi.mocked(getPaymentById).mockReturnValueOnce(Effect.succeed({ id: 'pi_test', status: 'succeeded' } as never));
    await run(handlePaymentSucceeded(EVENT));
    expect(updatePaymentStatus).not.toHaveBeenCalled();
  });

  it('calls retrieveCharge and updatePaymentCharge when latestChargeId is present', async () => {
    const { retrieveCharge } = await import('@infrastructure/services/payments/provider/charge');
    const { updatePaymentCharge } = await import('@infrastructure/services/payments/repository');
    await run(handlePaymentSucceeded(EVENT));
    expect(retrieveCharge).toHaveBeenCalledWith('ch_test');
    expect(updatePaymentCharge).toHaveBeenCalledOnce();
  });

  it('does not call retrieveCharge when latestChargeId is null', async () => {
    const { retrieveCharge } = await import('@infrastructure/services/payments/provider/charge');
    await run(handlePaymentSucceeded({ ...EVENT, latestChargeId: null }));
    expect(retrieveCharge).not.toHaveBeenCalled();
  });

  it('logs warning and resolves when payment is not found', async () => {
    const { getPaymentById } = await import('@infrastructure/services/payments/repository');
    vi.mocked(getPaymentById).mockReturnValueOnce(Effect.succeed(undefined as never));
    await expect(run(handlePaymentSucceeded(EVENT))).resolves.toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Payment not found after creation attempt',
      expect.objectContaining({ paymentId: 'pi_test' })
    );
  });

  it('resolves even when retrieveCharge fails', async () => {
    const { retrieveCharge } = await import('@infrastructure/services/payments/provider/charge');
    vi.mocked(retrieveCharge).mockReturnValueOnce(
      Effect.fail(new DatabaseError({ message: 'stripe error' })) as never
    );
    await expect(run(handlePaymentSucceeded(EVENT))).resolves.toBeUndefined();
  });

  it('resolves even when updatePaymentCharge fails', async () => {
    const { updatePaymentCharge } = await import('@infrastructure/services/payments/repository');
    vi.mocked(updatePaymentCharge).mockReturnValueOnce(
      Effect.fail(new DatabaseError({ message: 'db error' })) as never
    );
    await expect(run(handlePaymentSucceeded(EVENT))).resolves.toBeUndefined();
  });
});
