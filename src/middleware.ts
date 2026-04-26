import { routing } from '@infrastructure/i18n/routing';
import { location as locationProxy } from '@infrastructure/proxy/location';
import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const i18nProxy = createMiddleware(routing);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const accept = request.headers.get('accept') ?? '';
  const pathname = request.nextUrl.pathname;

  if (accept.includes('text/markdown') && !pathname.startsWith('/api/') && !pathname.startsWith('/.well-known/')) {
    const markdownUrl = new URL('/api/markdown', request.url);
    markdownUrl.searchParams.set('path', pathname);
    return NextResponse.rewrite(markdownUrl) as NextResponse;
  }

  const i18nResponse = i18nProxy(request);

  return await locationProxy({ request, response: i18nResponse });
}

export const config = {
  matcher: ['/', '/(en|es|ca|it|fr|de)/:path*', '/legal/:path*', '/payment/:path*'],
};
