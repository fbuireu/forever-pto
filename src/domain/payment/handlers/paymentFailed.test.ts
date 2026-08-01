import { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { DatabaseError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaymentFailedEvent } from '../events/types';
import { handlePaymentFailed } from './paymentFailed';

vi.mock('@infrastructure/services/payments/repository', () => ({
  getPaymentById: vi.fn(() => Effect.succeed({ id: 'pi_test', status: 'processing' })),
  updatePaymentStatus: vi.fn(() => Effect.succeed(undefined)),
}));

const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const TestLayer = Layer.mergeAll(
  Layer.succeed(LoggerService, mockLogger),
  Layer.succeed(TursoService, { query: vi.fn(), execute: vi.fn(), batch: vi.fn() })
);

type R = LoggerService | TursoService;
const run = <E>(eff: Effect.Effect<void, E, R>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));
const runFail = <E>(eff: Effect.Effect<void, E, R>) =>
  Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(TestLayer)));

const EVENT: PaymentFailedEvent = {
  type: 'payment_failed',
  paymentId: 'pi_test',
  status: 'requires_payment_method',
  errorMessage: 'Your card was declined.',
};

beforeEach(() => vi.clearAllMocks());

describe('handlePaymentFailed', () => {
  it('calls updatePaymentStatus with paymentId and status', async () => {
    const { updatePaymentStatus } = await import('@infrastructure/services/payments/repository');
    await run(handlePaymentFailed(EVENT));
    expect(updatePaymentStatus).toHaveBeenCalledWith('pi_test', 'requires_payment_method');
  });

  it('resolves on success', async () => {
    await expect(run(handlePaymentFailed(EVENT))).resolves.toBeUndefined();
  });

  it('fails with DatabaseError when updatePaymentStatus fails', async () => {
    const { updatePaymentStatus } = await import('@infrastructure/services/payments/repository');
    vi.mocked(updatePaymentStatus).mockReturnValueOnce(
      Effect.fail(new DatabaseError({ message: 'db error' })) as never
    );
    const err = await runFail(handlePaymentFailed(EVENT));
    expect(err).toBeInstanceOf(DatabaseError);
  });

  it('does not downgrade a payment that already succeeded', async () => {
    const { getPaymentById, updatePaymentStatus } = await import('@infrastructure/services/payments/repository');
    vi.mocked(getPaymentById).mockReturnValueOnce(Effect.succeed({ id: 'pi_test', status: 'succeeded' } as never));
    await run(handlePaymentFailed(EVENT));
    expect(updatePaymentStatus).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Ignoring failed-payment event for an already-succeeded payment',
      expect.objectContaining({ paymentId: 'pi_test' })
    );
  });

  it('still writes the failure when no row exists yet', async () => {
    const { getPaymentById, updatePaymentStatus } = await import('@infrastructure/services/payments/repository');
    vi.mocked(getPaymentById).mockReturnValueOnce(Effect.succeed(undefined as never));
    await run(handlePaymentFailed(EVENT));
    expect(updatePaymentStatus).toHaveBeenCalledWith('pi_test', 'requires_payment_method');
  });

  it('still writes the failure when the status read fails', async () => {
    const { getPaymentById, updatePaymentStatus } = await import('@infrastructure/services/payments/repository');
    vi.mocked(getPaymentById).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: 'db error' })) as never);
    await run(handlePaymentFailed(EVENT));
    expect(updatePaymentStatus).toHaveBeenCalledWith('pi_test', 'requires_payment_method');
  });

  it('calls logError when updatePaymentStatus fails', async () => {
    const { updatePaymentStatus } = await import('@infrastructure/services/payments/repository');
    vi.mocked(updatePaymentStatus).mockReturnValueOnce(
      Effect.fail(new DatabaseError({ message: 'db error' })) as never
    );
    await runFail(handlePaymentFailed(EVENT));
    expect(mockLogger.logError).toHaveBeenCalledOnce();
  });
});
