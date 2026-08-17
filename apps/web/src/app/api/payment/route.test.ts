import { ApiError } from '@infrastructure/api/errors';
import { INVALID_BODY } from '@infrastructure/api/parseJsonBody';
import { PaymentError, PromoCodeError, PromoCodeErrors, RateLimitError, ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const mockCheckRateLimit = vi.hoisted(() => vi.fn<(ip: string) => Effect.Effect<void, RateLimitError>>());
const mockAfter = vi.hoisted(() => vi.fn((work: () => unknown) => work()));

const mockCreatePayment = vi.hoisted(() =>
  vi.fn<
    (
      body: unknown,
      ctx: unknown
    ) => Effect.Effect<
      { clientSecret: string; discountInfo: null; deferred?: Effect.Effect<void> },
      ValidationError | PaymentError | PromoCodeError
    >
  >()
);

vi.mock('@infrastructure/services/payments/rateLimit', () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock('@application/use-cases/payment', () => ({
  createPayment: mockCreatePayment,
}));

vi.mock('@infrastructure/layers', () => ({
  ApplicationLayer: Layer.empty,
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return { ...actual, after: mockAfter };
});

const { POST } = await import('./route');

function makeRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request('http://localhost/api/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function makeRawRequest(body: string | null): Request {
  return new Request('http://localhost/api/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

describe('POST /api/payment', () => {
  it('runs the deferred half after responding, so persisting the record cannot delay the reply', async () => {
    const persisted = vi.fn();
    mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
    mockCreatePayment.mockReturnValue(
      Effect.succeed({
        clientSecret: 'client-secret-deferred',
        discountInfo: null,
        deferred: Effect.sync(persisted),
      })
    );

    const response = await POST(makeRequest({ amount: 9.99, email: 'user@example.com' }) as never);

    expect(response.status).toBe(200);
    expect(mockAfter).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(persisted).toHaveBeenCalledTimes(1));
  });

  it('returns 200 with clientSecret on success', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
    mockCreatePayment.mockReturnValue(
      Effect.succeed({ clientSecret: 'client-secret-abc', discountInfo: null, deferred: Effect.void })
    );
    const response = await POST(makeRequest({ amount: 9.99, email: 'user@example.com' }) as never);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.clientSecret).toBe('client-secret-abc');
    expect(body.discountInfo).toBeUndefined();
  });

  it('uses cf-connecting-ip header for rate limiting', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
    mockCreatePayment.mockReturnValue(
      Effect.succeed({ clientSecret: 'pi_secret', discountInfo: null, deferred: Effect.void })
    );
    await POST(makeRequest({}, { 'cf-connecting-ip': '1.2.3.4' }) as never);
    expect(mockCheckRateLimit).toHaveBeenCalledWith('1.2.3.4');
  });

  it('returns 429 on RateLimitError', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.fail(new RateLimitError({ ip: '1.2.3.4' })));
    const response = await POST(makeRequest({}) as never);
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe(ApiError.RATE_LIMIT_EXCEEDED);
  });

  it('returns 400 on ValidationError', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
    mockCreatePayment.mockReturnValue(Effect.fail(new ValidationError({ message: 'Amount is required' })));
    const response = await POST(makeRequest({}) as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Amount is required');
  });

  it('returns 400 with the validation shape when the body is malformed', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
    const response = await POST(makeRawRequest('{not json') as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe(INVALID_BODY);
  });

  it('returns 400 with the validation shape when the body is empty', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
    const response = await POST(makeRawRequest(null) as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe(INVALID_BODY);
  });

  it('returns 400 on PromoCodeError with code and isPromoCodeError', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
    mockCreatePayment.mockReturnValue(Effect.fail(new PromoCodeError({ code: PromoCodeErrors.INVALID_OR_EXPIRED })));
    const response = await POST(makeRequest({ promoCode: 'NOPE' }) as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe(PromoCodeErrors.INVALID_OR_EXPIRED);
    expect(body.isPromoCodeError).toBe(true);
  });

  it('returns 500 on PaymentError', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
    mockCreatePayment.mockReturnValue(Effect.fail(new PaymentError({ message: 'Stripe error' })));
    const response = await POST(makeRequest({}) as never);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe(ApiError.INTERNAL_ERROR);
  });

  it('returns 500 on unexpected typed error', async () => {
    mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
    mockCreatePayment.mockReturnValue(
      Effect.fail(new Error('unexpected')) as unknown as Effect.Effect<
        { clientSecret: string; discountInfo: null },
        ValidationError | PaymentError | PromoCodeError
      >
    );
    const response = await POST(makeRequest({}) as never);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe(ApiError.INTERNAL_ERROR);
  });
});
