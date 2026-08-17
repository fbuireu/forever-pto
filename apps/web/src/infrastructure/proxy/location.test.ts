import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDetectCountry } = vi.hoisted(() => ({
  mockDetectCountry: vi.fn(),
}));

const { mockSetLocationCookie } = vi.hoisted(() => ({
  mockSetLocationCookie: vi.fn(),
}));

vi.mock('@infrastructure/services/location/detectCountry', () => ({
  detectCountry: mockDetectCountry,
}));

vi.mock('./cookie', () => ({
  USER_COUNTRY_COOKIE: 'user-country',
  setLocationCookie: mockSetLocationCookie,
}));

import { location } from './location';

function makeParams(country: string | null = null, cookieValue?: string) {
  mockDetectCountry.mockResolvedValue(country);
  const response = { cookies: { set: vi.fn() } };
  const request = {
    cookies: { get: vi.fn().mockReturnValue(cookieValue ? { value: cookieValue } : undefined) },
  };
  return { request, response };
}

describe('location', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('always returns the response', async () => {
    const { request, response } = makeParams('ES');
    await expect(location({ request, response } as never)).resolves.toBe(response);
  });

  it('calls setLocationCookie with the detected country', async () => {
    const { request, response } = makeParams('ES');
    await location({ request, response } as never);
    expect(mockSetLocationCookie).toHaveBeenCalledWith(response, 'ES');
  });

  it('does not call setLocationCookie when no country is detected', async () => {
    const { request, response } = makeParams(null);
    await location({ request, response } as never);
    expect(mockSetLocationCookie).not.toHaveBeenCalled();
  });

  it('still returns the response when no country is detected', async () => {
    const { request, response } = makeParams(null);
    await expect(location({ request, response } as never)).resolves.toBe(response);
  });

  describe('when the country cookie is already present', () => {
    it('does not run detection', async () => {
      const { request, response } = makeParams('FR', 'ES');
      await location({ request, response } as never);
      expect(mockDetectCountry).not.toHaveBeenCalled();
    });

    it('re-sets the cookie so the expiry window slides', async () => {
      const { request, response } = makeParams('FR', 'ES');
      await location({ request, response } as never);
      expect(mockSetLocationCookie).toHaveBeenCalledWith(response, 'ES');
    });

    it('returns the response', async () => {
      const { request, response } = makeParams('FR', 'ES');
      await expect(location({ request, response } as never)).resolves.toBe(response);
    });
  });
});
