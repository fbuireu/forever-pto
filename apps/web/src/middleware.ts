import { setLocaleCookie } from '@infrastructure/i18n/cookie';
import { LOCALE_COOKIE } from '@infrastructure/i18n/locales';
import { routing } from '@infrastructure/i18n/routing';
import { MARKDOWN_ACCEPT, MARKDOWN_PATH_HEADER, MARKDOWN_ROUTE } from '@infrastructure/markdown/twin';
import { location as locationProxy } from '@infrastructure/proxy/location';
import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const i18nProxy = createMiddleware(routing);

const PAYMENT_CONFIRMATION_PATH = '/payment/confirmation';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const accept = request.headers.get('accept') ?? '';
  const pathname = request.nextUrl.pathname;
  const isMarkdownRequest = accept.includes(MARKDOWN_ACCEPT);

  if (pathname === MARKDOWN_ROUTE) {
    const headers = new Headers(request.headers);
    headers.delete(MARKDOWN_PATH_HEADER);

    return NextResponse.next({ request: { headers } });
  }

  if (isMarkdownRequest) {
    const headers = new Headers(request.headers);
    headers.set(MARKDOWN_PATH_HEADER, pathname);

    return NextResponse.rewrite(new URL(MARKDOWN_ROUTE, request.url), { request: { headers } });
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
