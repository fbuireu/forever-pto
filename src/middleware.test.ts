import { LOCALE_COOKIE } from '@infrastructure/i18n/config';
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

const BASE_URL = 'https://forever-pto.com';

const { middleware } = await import('./middleware');

function makeRequest(pathname: string, accept = ''): NextRequest {
  return {
    headers: { get: (key: string) => (key === 'accept' ? accept : null) },
    nextUrl: { pathname },
    url: `${BASE_URL}${pathname}`,
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
      const url: URL = spy.mock.calls[0][0] as URL;
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

  describe('locale cookie hardening', () => {
    it('upgrades the locale cookie to httpOnly + secure + sameSite lax', async () => {
      mockI18nResponse.cookies.get.mockReturnValue({ value: 'es' });
      const request = makeRequest('/es');

      await middleware(request);

      expect(mockI18nResponse.cookies.set).toHaveBeenCalledWith({
        name: LOCALE_COOKIE,
        value: 'es',
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
