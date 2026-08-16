import { ApiError } from '@infrastructure/api/errors';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import { DatabaseError, PaymentError, RateLimitError, SessionError, ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const logger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  logError: vi.fn(),
}));

const mockAfter = vi.hoisted(() => vi.fn());

vi.mock('@infrastructure/layers', () => ({ ApplicationLayer: Layer.succeed(LoggerService, logger) }));
vi.mock('next/server', () => ({ after: mockAfter }));

const { activatePremiumRequest } = await import('./activatePremium');

const succeeds = Effect.succeed({
  email: 'user@example.com',
  premiumKey: 'pi_abc',
  token: 'tok',
  deferred: Effect.void,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('activatePremiumRequest', () => {
  it('answers 200 with the token and hands the deferred to after()', async () => {
    const outcome = await activatePremiumRequest(succeeds as never);

    expect(outcome).toEqual({
      status: 200,
      token: 'tok',
      email: 'user@example.com',
      premiumKey: 'pi_abc',
      error: null,
    });
    expect(mockAfter).toHaveBeenCalledOnce();
  });

  it.each([
    [new RateLimitError({ ip: '1.2.3.4' }), 429, ApiError.RATE_LIMIT_EXCEEDED, 'warn'],
    [new ValidationError({ message: 'Client secret mismatch' }), 400, 'Client secret mismatch', 'warn'],
    [new PaymentError({ message: "No such payment_intent: 'pi_3ABC'" }), 500, ApiError.INTERNAL_ERROR, 'error'],
    [new SessionError({ message: 'jwt malformed' }), 500, ApiError.INTERNAL_ERROR, 'error'],
    [new DatabaseError({ message: 'turso down' }), 500, ApiError.INTERNAL_ERROR, 'error'],
  ])('maps %s to its own status and logs it', async (failure, status, error, level) => {
    const outcome = await activatePremiumRequest(Effect.fail(failure) as never);

    expect(outcome).toMatchObject({ status, error, token: null });
    expect(logger[level as 'warn' | 'error']).toHaveBeenCalledOnce();
  });

  it('never leaks a Stripe message to the caller', async () => {
    const outcome = await activatePremiumRequest(
      Effect.fail(new PaymentError({ message: "No such payment_intent: 'pi_3ABC'" })) as never
    );

    expect(outcome.error).toBe(ApiError.INTERNAL_ERROR);
    expect(outcome.error).not.toContain('pi_3ABC');
  });

  it('does not schedule the deferred when activation refuses', async () => {
    await activatePremiumRequest(Effect.fail(new ValidationError({ message: 'Email mismatch' })) as never);
    expect(mockAfter).not.toHaveBeenCalled();
  });
});
