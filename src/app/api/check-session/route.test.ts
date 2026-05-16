import { ApiError } from '@infrastructure/api/errors';
import { SessionError, ValidationError } from '@infrastructure/errors';
import { Effect, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const mockVerifySession = vi.hoisted(() =>
  vi.fn<(token: string) => Effect.Effect<{ email: string; paymentIntentId: string }, SessionError>>()
);
const mockActivateWithEmail = vi.hoisted(() =>
  vi.fn<
    (
      email: string
    ) => Effect.Effect<{ email: string; premiumKey: string; token: string }, ValidationError | SessionError>
  >()
);
const mockActivateWithPayment = vi.hoisted(() =>
  vi.fn<
    (
      email: string,
      key: string
    ) => Effect.Effect<{ email: string; premiumKey: string; token: string }, ValidationError | SessionError>
  >()
);
const mockClearPremiumCookie = vi.hoisted(() => vi.fn());
const mockSetPremiumCookie = vi.hoisted(() => vi.fn());
const mockCookiesGet = vi.hoisted(() => vi.fn());

vi.mock('@infrastructure/services/premium/session', () => ({
  verifySession: mockVerifySession,
}));

vi.mock('@application/use-cases/activatePremium', () => ({
  activateWithEmail: mockActivateWithEmail,
  activateWithPayment: mockActivateWithPayment,
}));

vi.mock('@infrastructure/services/premium/cookie', () => ({
  clearPremiumCookie: mockClearPremiumCookie,
  setPremiumCookie: mockSetPremiumCookie,
  PREMIUM_COOKIE: 'premium-token',
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookiesGet }),
}));

vi.mock('@infrastructure/layers', () => ({
  ApplicationLayer: Layer.empty,
}));

vi.mock('@infrastructure/api/response', async () => {
  const { NextResponse } = await import('next/server');
  return {
    noStore: (body: object, init?: ResponseInit) => {
      const res = NextResponse.json(body, init);
      res.headers.set('Cache-Control', 'no-store');
      return res;
    },
  };
});

const { GET, POST } = await import('./route');

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/check-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/check-session', () => {
  it('returns null fields when no cookie is present', async () => {
    mockCookiesGet.mockReturnValue(undefined);
    const response = await GET(new Request('http://localhost/api/check-session') as never);
    const body = await response.json();
    expect(body).toEqual({ premiumKey: null, email: null });
  });

  it('returns session data when token is valid', async () => {
    mockCookiesGet.mockReturnValue({ value: 'valid-token' });
    mockVerifySession.mockReturnValue(Effect.succeed({ email: 'user@example.com', paymentIntentId: 'pi_abc' }));
    const response = await GET(new Request('http://localhost/api/check-session') as never);
    const body = await response.json();
    expect(body).toEqual({ premiumKey: 'pi_abc', email: 'user@example.com' });
  });

  it('clears cookie and returns null fields when session is invalid', async () => {
    mockCookiesGet.mockReturnValue({ value: 'bad-token' });
    mockVerifySession.mockReturnValue(Effect.fail(new SessionError({ message: 'invalid' })));
    const response = await GET(new Request('http://localhost/api/check-session') as never);
    const body = await response.json();
    expect(body).toEqual({ premiumKey: null, email: null });
    expect(mockClearPremiumCookie).toHaveBeenCalled();
  });
});

describe('POST /api/check-session', () => {
  it('returns 400 when email is missing', async () => {
    const response = await POST(makeRequest({ premiumKey: 'pi_abc' }) as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe(ApiError.EMAIL_REQUIRED);
  });

  it('activates with email only when no premiumKey provided', async () => {
    mockActivateWithEmail.mockReturnValue(
      Effect.succeed({ email: 'user@example.com', premiumKey: 'pi_abc', token: 'tok' })
    );
    const response = await POST(makeRequest({ email: 'user@example.com' }) as never);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.email).toBe('user@example.com');
    expect(mockActivateWithEmail).toHaveBeenCalledWith('user@example.com');
    expect(mockSetPremiumCookie).toHaveBeenCalled();
  });

  it('activates with premiumKey when provided', async () => {
    mockActivateWithPayment.mockReturnValue(
      Effect.succeed({ email: 'user@example.com', premiumKey: 'pi_abc', token: 'tok' })
    );
    const response = await POST(makeRequest({ email: 'user@example.com', premiumKey: 'pi_abc' }) as never);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockActivateWithPayment).toHaveBeenCalledWith('user@example.com', 'pi_abc');
  });

  it('returns 400 on ValidationError', async () => {
    mockActivateWithEmail.mockReturnValue(Effect.fail(new ValidationError({ message: 'No payment found' })));
    const response = await POST(makeRequest({ email: 'user@example.com' }) as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('No payment found');
  });

  it('returns 500 on SessionError', async () => {
    mockActivateWithEmail.mockReturnValue(Effect.fail(new SessionError({ message: 'jwt error' })));
    const response = await POST(makeRequest({ email: 'user@example.com' }) as never);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe(ApiError.INTERNAL_ERROR);
  });
});
