interface SetCookieParams {
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  sameSite?: 'strict' | 'lax' | 'none';
}

export async function setCookie({ name, value, path = '/', maxAge, sameSite = 'lax' }: SetCookieParams) {
  await cookieStore.set({
    name,
    value,
    path,
    expires: maxAge === undefined ? undefined : Temporal.Now.instant().add({ seconds: maxAge }).epochMilliseconds,
    sameSite,
  });
}
