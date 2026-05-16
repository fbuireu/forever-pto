import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import { PaymentError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { confirmation } = await import('./confirmation');

const mockRetrieve = vi.fn();
const mockLogError = vi.fn();

const MockStripeLayer = Layer.succeed(StripeServerService, {
  paymentIntents: {
    create: vi.fn(),
    retrieve: mockRetrieve,
  },
  charges: { retrieve: vi.fn() },
  promotionCodes: { list: vi.fn(), retrieve: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
});

const MockLoggerLayer = Layer.succeed(LoggerService, {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  logError: mockLogError,
});

const MockLayer = Layer.mergeAll(MockStripeLayer, MockLoggerLayer);

const run = (id: string) =>
  Effect.runPromise(confirmation(id).pipe(Effect.provide(MockLayer)));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('confirmation', () => {
  it('returns a DTO when the payment intent is retrieved successfully', async () => {
    mockRetrieve.mockReturnValue(
      Effect.succeed({ id: 'pi_123', status: 'succeeded', amount: 1000, currency: 'eur' })
    );
    const result = await run('pi_123');
    expect(result).toEqual({ id: 'pi_123', status: 'succeeded', amount: 10, currency: 'EUR' });
  });

  it('converts amount from cents to euros', async () => {
    mockRetrieve.mockReturnValue(
      Effect.succeed({ id: 'pi_456', status: 'succeeded', amount: 500, currency: 'eur' })
    );
    const result = await run('pi_456');
    expect(result?.amount).toBe(5);
  });

  it('uppercases the currency', async () => {
    mockRetrieve.mockReturnValue(
      Effect.succeed({ id: 'pi_789', status: 'succeeded', amount: 200, currency: 'usd' })
    );
    const result = await run('pi_789');
    expect(result?.currency).toBe('USD');
  });

  it('returns null and calls logError when Stripe fails', async () => {
    const error = new PaymentError({ message: 'Stripe unavailable' });
    mockRetrieve.mockReturnValue(Effect.fail(error));
    const result = await run('pi_err');
    expect(result).toBeNull();
    expect(mockLogError).toHaveBeenCalledOnce();
    expect(mockLogError).toHaveBeenCalledWith(
      'Failed to retrieve payment intent',
      error,
      expect.objectContaining({ paymentIntentId: 'pi_err', service: 'confirmation' })
    );
  });
});
