import { Temporal } from 'temporal-polyfill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCookieStoreSet = vi.fn();

beforeEach(() => {
  vi.stubGlobal('cookieStore', { set: mockCookieStoreSet });
  mockCookieStoreSet.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const { setCookie } = await import('./cookie');

describe('setCookie', () => {
  it('calls cookieStore.set with name and value', async () => {
    await setCookie({ name: 'foo', value: 'bar' });
    expect(mockCookieStoreSet).toHaveBeenCalledWith(expect.objectContaining({ name: 'foo', value: 'bar' }));
  });

  it('defaults path to /', async () => {
    await setCookie({ name: 'foo', value: 'bar' });
    expect(mockCookieStoreSet).toHaveBeenCalledWith(expect.objectContaining({ path: '/' }));
  });

  it('defaults sameSite to lax', async () => {
    await setCookie({ name: 'foo', value: 'bar' });
    expect(mockCookieStoreSet).toHaveBeenCalledWith(expect.objectContaining({ sameSite: 'lax' }));
  });

  it('converts maxAge (seconds) to expires (ms timestamp)', async () => {
    const fakeInstant = Temporal.Instant.fromEpochMilliseconds(1_000_000_000_000);
    vi.spyOn(Temporal.Now, 'instant').mockReturnValue(fakeInstant);
    await setCookie({ name: 'foo', value: 'bar', maxAge: 60 });
    expect(mockCookieStoreSet).toHaveBeenCalledWith(
      expect.objectContaining({ expires: fakeInstant.add({ seconds: 60 }).epochMilliseconds })
    );
    vi.restoreAllMocks();
  });

  it('sets expires to undefined when maxAge is not provided', async () => {
    await setCookie({ name: 'foo', value: 'bar' });
    expect(mockCookieStoreSet).toHaveBeenCalledWith(expect.objectContaining({ expires: undefined }));
  });

  it('respects a custom sameSite option', async () => {
    await setCookie({ name: 'foo', value: 'bar', sameSite: 'strict' });
    expect(mockCookieStoreSet).toHaveBeenCalledWith(expect.objectContaining({ sameSite: 'strict' }));
  });

  it('respects a custom path option', async () => {
    await setCookie({ name: 'foo', value: 'bar', path: '/admin' });
    expect(mockCookieStoreSet).toHaveBeenCalledWith(expect.objectContaining({ path: '/admin' }));
  });

  it('does not include a secure property (handled automatically by the browser)', async () => {
    await setCookie({ name: 'foo', value: 'bar' });
    const call = mockCookieStoreSet.mock.calls[0][0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('secure');
  });
});
