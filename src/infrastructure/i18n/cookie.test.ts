import { describe, expect, it, vi } from 'vitest';
import { setLocaleCookie } from './cookie';
import { ES } from './locales';

vi.mock('@infrastructure/i18n/config', () => ({
  LOCALE_COOKIE: 'NEXT_LOCALE',
}));

import { LOCALE_COOKIE } from '@infrastructure/i18n/config';

function makeResponse() {
  const cookiesSet = vi.fn();
  return { response: { cookies: { set: cookiesSet } } as never, cookiesSet };
}

describe('setLocaleCookie', () => {
  it('sets the cookie with the correct name and value', () => {
    const { response, cookiesSet } = makeResponse();
    setLocaleCookie(response, ES);
    expect(cookiesSet).toHaveBeenCalledWith(expect.objectContaining({ name: LOCALE_COOKIE, value: ES }));
  });

  it('sets httpOnly', () => {
    const { response, cookiesSet } = makeResponse();
    setLocaleCookie(response, ES);
    expect(cookiesSet).toHaveBeenCalledWith(expect.objectContaining({ httpOnly: true }));
  });

  it('sets secure', () => {
    const { response, cookiesSet } = makeResponse();
    setLocaleCookie(response, ES);
    expect(cookiesSet).toHaveBeenCalledWith(expect.objectContaining({ secure: true }));
  });

  it('sets sameSite lax', () => {
    const { response, cookiesSet } = makeResponse();
    setLocaleCookie(response, ES);
    expect(cookiesSet).toHaveBeenCalledWith(expect.objectContaining({ sameSite: 'lax' }));
  });

  it('sets path to "/"', () => {
    const { response, cookiesSet } = makeResponse();
    setLocaleCookie(response, ES);
    expect(cookiesSet).toHaveBeenCalledWith(expect.objectContaining({ path: '/' }));
  });
});
