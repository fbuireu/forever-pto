import { describe, expect, it, vi } from 'vitest';
import { ONE_WEEK, setLocationCookie, USER_COUNTRY_COOKIE } from './cookie';

function makeResponse() {
  const cookiesSet = vi.fn();
  return { response: { cookies: { set: cookiesSet } } as never, cookiesSet };
}

describe('ONE_WEEK', () => {
  it('equals 604800 seconds', () => {
    expect(ONE_WEEK).toBe(604_800);
  });
});

describe('USER_COUNTRY_COOKIE', () => {
  it('is "user-country"', () => {
    expect(USER_COUNTRY_COOKIE).toBe('user-country');
  });
});

describe('setLocationCookie', () => {
  it('sets the cookie with the correct name and country value', () => {
    const { response, cookiesSet } = makeResponse();
    setLocationCookie(response, 'ES');
    expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, 'ES', expect.any(Object));
  });

  it('sets httpOnly to false', () => {
    const { response, cookiesSet } = makeResponse();
    setLocationCookie(response, 'ES');
    expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, 'ES', expect.objectContaining({ httpOnly: false }));
  });

  it('sets secure', () => {
    const { response, cookiesSet } = makeResponse();
    setLocationCookie(response, 'ES');
    expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, 'ES', expect.objectContaining({ secure: true }));
  });

  it('sets sameSite strict', () => {
    const { response, cookiesSet } = makeResponse();
    setLocationCookie(response, 'ES');
    expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, 'ES', expect.objectContaining({ sameSite: 'strict' }));
  });

  it('sets maxAge to ONE_WEEK', () => {
    const { response, cookiesSet } = makeResponse();
    setLocationCookie(response, 'ES');
    expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, 'ES', expect.objectContaining({ maxAge: ONE_WEEK }));
  });

  it('sets path to "/"', () => {
    const { response, cookiesSet } = makeResponse();
    setLocationCookie(response, 'ES');
    expect(cookiesSet).toHaveBeenCalledWith(USER_COUNTRY_COOKIE, 'ES', expect.objectContaining({ path: '/' }));
  });
});
