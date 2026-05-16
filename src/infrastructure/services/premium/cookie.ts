import type { NextResponse } from 'next/server';

export const PREMIUM_COOKIE = 'premium-token';
const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60;
const isProd = process.env.NODE_ENV === 'production';

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
