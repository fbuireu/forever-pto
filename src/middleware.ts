import { routing } from '@infrastructure/i18n/routing';
import { location as locationMiddleware } from '@infrastructure/middleware/location';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest, NextResponse } from 'next/server';

const i18nMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const i18nResponse = i18nMiddleware(request);

  return await locationMiddleware({ request, response: i18nResponse });
}

export const config = {
  matcher: ['/', '/(en|es|ca|it)/:path*'],
};
