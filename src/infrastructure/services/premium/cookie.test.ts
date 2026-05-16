import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function makeMockResponse() {
  return { cookies: { set: vi.fn(), delete: vi.fn() } } as any;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('setPremiumCookie', () => {
  it('sets cookie with all correct options in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { setPremiumCookie, PREMIUM_COOKIE } = await import('./cookie');
    const response = makeMockResponse();

    setPremiumCookie(response, 'my-token');

    expect(response.cookies.set).toHaveBeenCalledWith(PREMIUM_COOKIE, 'my-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
  });

  it('sets secure:false in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { setPremiumCookie, PREMIUM_COOKIE } = await import('./cookie');
    const response = makeMockResponse();

    setPremiumCookie(response, 'my-token');

    expect(response.cookies.set).toHaveBeenCalledWith(PREMIUM_COOKIE, 'my-token', expect.objectContaining({ secure: false }));
  });
});

describe('clearPremiumCookie', () => {
  it('deletes the premium cookie from the response', async () => {
    const { clearPremiumCookie, PREMIUM_COOKIE } = await import('./cookie');
    const response = makeMockResponse();

    clearPremiumCookie(response);

    expect(response.cookies.delete).toHaveBeenCalledWith(PREMIUM_COOKIE);
  });
});
