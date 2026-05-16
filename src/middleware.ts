import { LOCALE_COOKIE } from '@infrastructure/i18n/config';
import { setLocaleCookie } from '@infrastructure/i18n/cookie';
import { routing } from '@infrastructure/i18n/routing';
import { location as locationProxy } from '@infrastructure/proxy/location';
import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const i18nProxy = createMiddleware(routing);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const accept = request.headers.get('accept') ?? '';
  const pathname = request.nextUrl.pathname;
  const isMarkdownRequest = accept.includes('text/markdown');
  const isInternalPath = pathname.startsWith('/api/') || pathname.startsWith('/.well-known/');

  if (isMarkdownRequest && !isInternalPath) {
    const markdownUrl = new URL('/api/markdown', request.url);
    markdownUrl.searchParams.set('path', pathname);

    return NextResponse.rewrite(markdownUrl);
  }

  const i18nResponse = i18nProxy(request);

  const localeCookie = i18nResponse.cookies.get(LOCALE_COOKIE);
  if (localeCookie) {
    setLocaleCookie(i18nResponse, localeCookie.value);
  }

  return await locationProxy({ request, response: i18nResponse });
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
