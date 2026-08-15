import { LOCALE_COOKIE } from '@infrastructure/i18n/config';
import type { NextResponse } from 'next/server';

export function setLocaleCookie(response: NextResponse, value: string) {
  response.cookies.set({
    name: LOCALE_COOKIE,
    value,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}
