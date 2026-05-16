import type { NextResponse } from 'next/server';
import { isProd, PREMIUM_COOKIE, SESSION_DURATION_SECONDS } from './config';

export function setPremiumCookie(response: NextResponse, token: string) {
  response.cookies.set(PREMIUM_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });
}

export function clearPremiumCookie(response: NextResponse) {
  response.cookies.delete(PREMIUM_COOKIE);
}
