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
  setLocationCookie: mockSetLocationCookie,
}));

import { location } from './location';

function makeParams(country: string | null = null) {
  mockDetectCountry.mockResolvedValue(country);
  const response = { cookies: { set: vi.fn() } };
  const request = {};
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
});
