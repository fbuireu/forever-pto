import { routing } from '@infrastructure/i18n/routing';
import { location as locationProxy } from '@infrastructure/proxy/location';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const TEAM_DOMAIN = process.env.CF_ACCESS_TEAM_DOMAIN;
const WORKERS_AUD = process.env.CF_ACCESS_WORKERS_AUD;
const PREVIEW_AUD = process.env.CF_ACCESS_PREVIEW_AUD;
const JWKS = TEAM_DOMAIN
  ? createRemoteJWKSet(new URL(`${TEAM_DOMAIN}/cdn-cgi/access/certs`))
  : null;

async function validateCFAccessToken(request: NextRequest, aud: string): Promise<boolean> {
  const token =
    request.headers.get('cf-access-jwt-assertion') ??
    request.cookies.get('CF_Authorization')?.value;

  if (!token || !JWKS || !TEAM_DOMAIN) return false;

  try {
    await jwtVerify(token, JWKS, { issuer: TEAM_DOMAIN, audience: aud });
    return true;
  } catch {
    return false;
  }
}

const i18nProxy = createMiddleware(routing);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get('host') ?? '';
  const isWorkersDev = host.endsWith('.workers.dev');
  const isPreview = host.endsWith('.pages.dev');

  if (isWorkersDev && WORKERS_AUD) {
    const isValid = await validateCFAccessToken(request, WORKERS_AUD);
    if (!isValid) return new Response('Unauthorized', { status: 401 }) as unknown as NextResponse;
  }

  if (isPreview && PREVIEW_AUD) {
    const isValid = await validateCFAccessToken(request, PREVIEW_AUD);
    if (!isValid) return new Response('Unauthorized', { status: 401 }) as unknown as NextResponse;
  }

  const i18nResponse = i18nProxy(request);

  return await locationProxy({ request, response: i18nResponse });
}

export const config = {
  matcher: ['/', '/(en|es|ca|it)/:path*', '/legal/:path*', '/payment/:path*'],
};
