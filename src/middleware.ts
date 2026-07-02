import { LOCALE_COOKIE } from '@infrastructure/i18n/config';
import { setLocaleCookie } from '@infrastructure/i18n/cookie';
import { routing } from '@infrastructure/i18n/routing';
import { location as locationProxy } from '@infrastructure/proxy/location';
import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const i18nProxy = createMiddleware(routing);

const PAYMENT_CONFIRMATION_PATH = '/payment/confirmation';
// Under cacheComponents, Next.js stamps dynamic route-handler responses with a no-store
// Cache-Control that replaces the handler's own header; middleware response headers are
// applied after the render, so the intended caching policy is restored here.
const MARKDOWN_CACHE_CONTROL = 'public, max-age=3600';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const accept = request.headers.get('accept') ?? '';
  const pathname = request.nextUrl.pathname;
  const isMarkdownRequest = accept.includes('text/markdown');
  const isInternalPath = pathname.startsWith('/api/') || pathname.startsWith('/.well-known/');

  if (pathname === '/api/markdown') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', MARKDOWN_CACHE_CONTROL);
    return response;
  }

  if (isMarkdownRequest && !isInternalPath) {
    const markdownUrl = new URL('/api/markdown', request.url);
    markdownUrl.searchParams.set('path', pathname);

    const response = NextResponse.rewrite(markdownUrl);
    response.headers.set('Cache-Control', MARKDOWN_CACHE_CONTROL);
    return response;
  }

  // redirect() inside the PPR page streams after the 200 static shell instead of returning
  // an HTTP 3xx, so the missing-param guard must answer at the proxy level.
  if (pathname.endsWith(PAYMENT_CONFIRMATION_PATH) && !request.nextUrl.searchParams.has('payment_intent')) {
    const homePath = pathname.slice(0, -PAYMENT_CONFIRMATION_PATH.length) || '/';

    return NextResponse.redirect(new URL(homePath, request.url));
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
