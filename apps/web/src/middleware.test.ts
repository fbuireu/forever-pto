import { ES, LOCALE_COOKIE } from '@infrastructure/i18n/locales';
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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const { config, middleware } = await import('./middleware');

function makeRequest(pathname: string, accept = '', search = ''): NextRequest {
  return {
    headers: { get: (key: string) => (key === 'accept' ? accept : null) },
    nextUrl: { pathname, searchParams: new URLSearchParams(search) },
    url: `${BASE_URL}${pathname}${search ? `?${search}` : ''}`,
  } as unknown as NextRequest;
}

describe('config matcher', () => {
  const matchesPage = (pathname: string) => new RegExp(`^${config.matcher[0]}$`).test(pathname);

  it('matches page paths', () => {
    expect(matchesPage('/')).toBe(true);
    expect(matchesPage('/some-page')).toBe(true);
    expect(matchesPage(`/${ES}/planner`)).toBe(true);
  });

  it('excludes /api paths, and re-adds /api/markdown explicitly', () => {
    expect(matchesPage('/api/some-endpoint')).toBe(false);
    expect(matchesPage('/api/markdown')).toBe(false);
    expect(config.matcher).toContain('/api/markdown');
  });

  it('excludes dotted paths such as /.well-known/*', () => {
    expect(matchesPage('/.well-known/security.txt')).toBe(false);
  });

  it('excludes framework paths', () => {
    expect(matchesPage('/_next/static/chunk.js')).toBe(false);
    expect(matchesPage('/_vercel/insights')).toBe(false);
  });
});

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

    it('does not rewrite non-markdown requests', async () => {
      const spy = vi.spyOn(NextResponse, 'rewrite');
      const request = makeRequest('/some-page', 'text/html');

      await middleware(request);

      expect(spy).not.toHaveBeenCalled();
    });

    it('sets public Cache-Control on the markdown rewrite response', async () => {
      const request = makeRequest('/some-page', 'text/markdown');

      const response = await middleware(request);

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    });

    it('sets Vary: Accept on the markdown rewrite response so caches key on the negotiated body', async () => {
      const request = makeRequest('/some-page', 'text/markdown');

      const response = await middleware(request);

      expect(response.headers.get('Vary')).toBe('Accept');
    });
  });

  describe('markdown api cache header', () => {
    it('sets public Cache-Control for direct /api/markdown requests', async () => {
      const request = makeRequest('/api/markdown', '', 'path=/');

      const response = await middleware(request);

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    });

    it('sets Vary: Accept for direct /api/markdown requests', async () => {
      const request = makeRequest('/api/markdown', '', 'path=/');

      const response = await middleware(request);

      expect(response.headers.get('Vary')).toBe('Accept');
    });

    it('does not run the i18n proxy for /api/markdown requests', async () => {
      const request = makeRequest('/api/markdown', '', 'path=/');

      await middleware(request);

      expect(mockI18nProxy).not.toHaveBeenCalled();
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
    });

    it('keeps the redirect on this origin when the path is protocol-relative', async () => {
      const spy = vi.spyOn(NextResponse, 'redirect');
      const request = makeRequest('//1234567890/payment/confirmation');

      await middleware(request);

      expect(spy).toHaveBeenCalledOnce();
      const url = spy.mock.calls[0][0] as URL;
      expect(url.origin).toBe(new URL(request.url).origin);
      expect(url.pathname).toBe('/1234567890');
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
