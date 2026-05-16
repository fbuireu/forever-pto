import type { NextResponse } from 'next/server';

export const USER_COUNTRY_COOKIE = 'user-country';
export const ONE_WEEK = 60 * 60 * 24 * 7;

export function setLocationCookie(response: NextResponse, country: string) {
  response.cookies.set(USER_COUNTRY_COOKIE, country, {
    httpOnly: false,
    secure: true,
    sameSite: 'strict',
    maxAge: ONE_WEEK,
    path: '/',
  });
}
