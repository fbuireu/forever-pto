import { ApiError } from '@infrastructure/api/errors';
import { PaymentError, PromoCodeError, PromoCodeErrors, RateLimitError, ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCheckRateLimit = vi.hoisted(() => vi.fn<(ip: string) => Effect.Effect<void, RateLimitError>>());
const mockCreatePayment = vi.hoisted(() =>
  vi.fn<
    (
      body: unknown,
      ctx: unknown
    ) => Effect.Effect<
      { clientSecret: string; discountInfo: null; deferred?: Effect.Effect<void> },
      ValidationError | PaymentError
    >
  >()
);
const mockAfter = vi.hoisted(() => vi.fn((work: () => unknown) => work()));

vi.mock('@infrastructure/services/payments/rateLimit', () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock('@application/use-cases/payment', () => ({ createPayment: mockCreatePayment }));
vi.mock('@infrastructure/layers', () => ({ ApplicationLayer: Layer.empty }));
vi.mock('next/server', () => ({ after: mockAfter }));

const { createPaymentRequest } = await import('./payment');

const CONTEXT = { userAgent: 'jest', ipAddress: '1.2.3.4' };
const INPUT = { amount: 9.99, email: 'donor@example.com' };

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
  mockCreatePayment.mockReturnValue(
    Effect.succeed({ clientSecret: 'pi_secret', discountInfo: null, deferred: Effect.void })
  );
});

describe('createPaymentRequest', () => {
  it('answers 200 and the client secret on success', async () => {
    const outcome = await createPaymentRequest(Effect.succeed(INPUT), CONTEXT);

    expect(outcome).toEqual({
      status: 200,
      body: { success: true, clientSecret: 'pi_secret', discountInfo: undefined },
    });
  });

  it('rate-limits before it reaches the use-case, whichever transport called it', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.fail(new RateLimitError({ ip: '1.2.3.4' })));

    const outcome = await createPaymentRequest(Effect.succeed(INPUT), CONTEXT);

    expect(outcome.status).toBe(429);
    expect(outcome.body).toEqual({ success: false, error: ApiError.RATE_LIMIT_EXCEEDED });
    expect(mockCreatePayment).not.toHaveBeenCalled();
  });

  it('keys the limiter on a resolved address and still hands the use-case the unresolved one', async () => {
    await createPaymentRequest(Effect.succeed(INPUT), { userAgent: null, ipAddress: null });

    expect(mockCheckRateLimit).toHaveBeenCalledWith('unknown');
    expect(mockCreatePayment).toHaveBeenCalledWith(INPUT, { userAgent: null, ipAddress: null });
  });

  it('never reads the body before the limiter has spoken', async () => {
    const read = vi.fn();
    mockCheckRateLimit.mockReturnValue(Effect.fail(new RateLimitError({ ip: '1.2.3.4' })));

    await createPaymentRequest(
      Effect.sync(() => {
        read();
        return INPUT;
      }),
      CONTEXT
    );

    expect(read).not.toHaveBeenCalled();
  });

  it('maps a malformed body to 400 carrying the code the parser raised', async () => {
    const outcome = await createPaymentRequest(Effect.fail(new ValidationError({ message: 'invalid_body' })), CONTEXT);

    expect(outcome).toEqual({ status: 400, body: { success: false, error: 'invalid_body' } });
  });

  it('maps a promo-code failure to 400 carrying the code and its own flag', async () => {
    mockCreatePayment.mockReturnValue(
      Effect.fail(new PromoCodeError({ code: PromoCodeErrors.USAGE_LIMIT_REACHED })) as never
    );

    const outcome = await createPaymentRequest(Effect.succeed(INPUT), CONTEXT);

    expect(outcome).toEqual({
      status: 400,
      body: { success: false, error: PromoCodeErrors.USAGE_LIMIT_REACHED, isPromoCodeError: true },
    });
  });

  it('maps a payment failure to 500 without leaking the reason', async () => {
    mockCreatePayment.mockReturnValue(Effect.fail(new PaymentError({ message: 'stripe exploded' })));

    const outcome = await createPaymentRequest(Effect.succeed(INPUT), CONTEXT);

    expect(outcome).toEqual({ status: 500, body: { success: false, error: ApiError.INTERNAL_ERROR } });
  });

  it('defers the record write so it cannot delay the reply', async () => {
    const persisted = vi.fn();
    mockCreatePayment.mockReturnValue(
      Effect.succeed({ clientSecret: 'pi_secret', discountInfo: null, deferred: Effect.sync(persisted) })
    );

    await createPaymentRequest(Effect.succeed(INPUT), CONTEXT);

    expect(mockAfter).toHaveBeenCalled();
    expect(persisted).toHaveBeenCalled();
  });
});
