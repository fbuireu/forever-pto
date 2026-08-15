import { Temporal } from 'temporal-polyfill';

interface SetCookieParams {
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  sameSite?: 'strict' | 'lax' | 'none';
}

export async function setCookie({ name, value, path = '/', maxAge, sameSite = 'lax' }: SetCookieParams) {
  if (typeof cookieStore !== 'undefined') {
    await cookieStore.set({
      name,
      value,
      path,
      expires: maxAge === undefined ? undefined : Temporal.Now.instant().add({ seconds: maxAge }).epochMilliseconds,
      sameSite,
    });
    return;
  }

  if (typeof document === 'undefined') return;

  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `path=${path}`,
    `samesite=${sameSite}`,
    ...(maxAge === undefined ? [] : [`max-age=${maxAge}`]),
    ...(typeof location !== 'undefined' && location.protocol === 'https:' ? ['secure'] : []),
  ];

  // biome-ignore lint/suspicious/noDocumentCookie: this branch is the fallback for browsers with no Cookie Store API
  document.cookie = attributes.join('; ');
}
