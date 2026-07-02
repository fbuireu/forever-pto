import { LOCALE_COOKIE } from '@infrastructure/i18n/config';
import { ES } from '@infrastructure/i18n/locales';
import { type NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockI18nResponse = {
  cookies: {
    get: vi.fn(),
    set: vi.fn(),
  },
};

const mockI18nProxy = vi.fn().mockReturnValue(mockI18nResponse);

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => mockI18nProxy),
}));

vi.mock('@infrastructure/i18n/routing', () => ({
  routing: {},
}));

vi.mock('@infrastructure/proxy/location', () => ({
  location: vi.fn(({ response }: { response: NextResponse }) => Promise.resolve(response)),
}));

const mockWarn = vi.fn();

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn(() => ({ warn: mockWarn })),
}));

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const { middleware } = await import('./middleware');

function makeRequest(pathname: string, accept = '', search = ''): NextRequest {
  return {
    headers: { get: (key: string) => (key === 'accept' ? accept : null) },
    nextUrl: { pathname, searchParams: new URLSearchParams(search) },
    url: `${BASE_URL}${pathname}${search ? `?${search}` : ''}`,
  } as unknown as NextRequest;
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18nResponse.cookies.get.mockReturnValue(null);
  });

  describe('markdown rewrite', () => {
    it('rewrites markdown requests to /api/markdown with path param', async () => {
      const spy = vi.spyOn(NextResponse, 'rewrite');
      const request = makeRequest('/some-page', 'text/markdown');

      await middleware(request);

      expect(spy).toHaveBeenCalledOnce();
      const url = spy.mock.calls[0][0] as URL;
      expect(url.pathname).toBe('/api/markdown');
      expect(url.searchParams.get('path')).toBe('/some-page');
    });

    it('does not rewrite markdown requests to /api/* paths', async () => {
      const spy = vi.spyOn(NextResponse, 'rewrite');
      const request = makeRequest('/api/some-endpoint', 'text/markdown');

      await middleware(request);

      expect(spy).not.toHaveBeenCalled();
    });

    it('does not rewrite markdown requests to /.well-known/* paths', async () => {
      const spy = vi.spyOn(NextResponse, 'rewrite');
      const request = makeRequest('/.well-known/security.txt', 'text/markdown');

      await middleware(request);

      expect(spy).not.toHaveBeenCalled();
    });

    it('does not rewrite non-markdown requests', async () => {
      const spy = vi.spyOn(NextResponse, 'rewrite');
      const request = makeRequest('/some-page', 'text/html');

      await middleware(request);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('payment confirmation redirect', () => {
    it('redirects /payment/confirmation to home when payment_intent is missing', async () => {
      const spy = vi.spyOn(NextResponse, 'redirect');
      const request = makeRequest('/payment/confirmation');

      await middleware(request);

      expect(spy).toHaveBeenCalledOnce();
      const url = spy.mock.calls[0][0] as URL;
      expect(url.pathname).toBe('/');
    });

    it('redirects locale-prefixed confirmation to the locale home when payment_intent is missing', async () => {
      const spy = vi.spyOn(NextResponse, 'redirect');
      const request = makeRequest(`/${ES}/payment/confirmation`);

      await middleware(request);

      expect(spy).toHaveBeenCalledOnce();
      const url = spy.mock.calls[0][0] as URL;
      expect(url.pathname).toBe(`/${ES}`);
    });

    it('does not redirect when payment_intent is present', async () => {
      const spy = vi.spyOn(NextResponse, 'redirect');
      const request = makeRequest('/payment/confirmation', '', 'payment_intent=pi_123&redirect_status=succeeded');

      await middleware(request);

      expect(spy).not.toHaveBeenCalled();
      expect(mockWarn).not.toHaveBeenCalled();
    });

    it('logs a warning when redirecting', async () => {
      const request = makeRequest('/payment/confirmation');

      await middleware(request);

      expect(mockWarn).toHaveBeenCalledWith(
        'Payment confirmation accessed without payment_intent, redirecting to home',
        { pathname: '/payment/confirmation' }
      );
    });

    it('still redirects when logging fails', async () => {
      const spy = vi.spyOn(NextResponse, 'redirect');
      mockWarn.mockImplementationOnce(() => {
        throw new Error('missing BetterStack envvars');
      });
      const request = makeRequest('/payment/confirmation');

      await middleware(request);

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('locale cookie hardening', () => {
    it('upgrades the locale cookie to httpOnly + secure + sameSite lax', async () => {
      mockI18nResponse.cookies.get.mockReturnValue({ value: ES });
      const request = makeRequest(`/${ES}`);

      await middleware(request);

      expect(mockI18nResponse.cookies.set).toHaveBeenCalledWith({
        name: LOCALE_COOKIE,
        value: ES,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
    });

    it('skips cookie hardening when no locale cookie is set', async () => {
      mockI18nResponse.cookies.get.mockReturnValue(null);
      const request = makeRequest('/');

      await middleware(request);

      expect(mockI18nResponse.cookies.set).not.toHaveBeenCalled();
    });
  });
});
