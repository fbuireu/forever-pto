import { setLocaleCookie } from '@infrastructure/i18n/cookie';
import { LOCALE_COOKIE } from '@infrastructure/i18n/locales';
import { routing } from '@infrastructure/i18n/routing';
import { location as locationProxy } from '@infrastructure/proxy/location';
import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const i18nProxy = createMiddleware(routing);

const PAYMENT_CONFIRMATION_PATH = '/payment/confirmation';
const MARKDOWN_CACHE_CONTROL = 'public, max-age=3600';
const MARKDOWN_VARY = 'Accept';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const accept = request.headers.get('accept') ?? '';
  const pathname = request.nextUrl.pathname;
  const isMarkdownRequest = accept.includes('text/markdown');

  if (pathname === '/api/markdown') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', MARKDOWN_CACHE_CONTROL);
    response.headers.set('Vary', MARKDOWN_VARY);
    return response;
  }

  if (isMarkdownRequest) {
    const markdownUrl = new URL('/api/markdown', request.url);
    markdownUrl.searchParams.set('path', pathname);

    const response = NextResponse.rewrite(markdownUrl);
    response.headers.set('Cache-Control', MARKDOWN_CACHE_CONTROL);
    response.headers.set('Vary', MARKDOWN_VARY);
    return response;
  }

  if (pathname.endsWith(PAYMENT_CONFIRMATION_PATH) && !request.nextUrl.searchParams.has('payment_intent')) {
    const homePath = `/${pathname.slice(0, -PAYMENT_CONFIRMATION_PATH.length).replace(/^\/+/, '')}`;
    const homeUrl = new URL(request.url);
    homeUrl.pathname = homePath;
    homeUrl.search = '';

    return NextResponse.redirect(homeUrl);
  }

  const i18nResponse = i18nProxy(request);

  const localeCookie = i18nResponse.cookies.get(LOCALE_COOKIE);
  if (localeCookie) {
    setLocaleCookie(i18nResponse, localeCookie.value);
  }

  return await locationProxy({ request, response: i18nResponse });
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/api/markdown'],
};
