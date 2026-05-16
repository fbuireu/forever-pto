import { DE, ES, FR } from '@infrastructure/i18n/locales';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: () => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() }),
}));

const mockGetCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

const { detectCountryFromCDN, detectCountryFromHeaders, detectCountryFromIP, CLOUDFLARE_COUNTRY_HEADER, UNIDENTIFIED_COUNTRY, TOR_COUNTRY } =
  await import('./strategies');

function makeRequest(country: string | null) {
  return { headers: { get: (header: string) => (header === CLOUDFLARE_COUNTRY_HEADER ? country : null) } } as never;
}

function makeResponse(ok: boolean, body: unknown) {
  return {
    ok,
    text: () => Promise.resolve(body as string),
    json: () => Promise.resolve(body),
  } as Response;
}

describe('detectCountryFromHeaders', () => {
  it('returns empty string when header is absent', () => {
    expect(detectCountryFromHeaders(makeRequest(null))).toBe('');
  });

  it('returns empty string for XX (unidentified)', () => {
    expect(detectCountryFromHeaders(makeRequest(UNIDENTIFIED_COUNTRY))).toBe('');
  });

  it('returns empty string for T1 (Tor)', () => {
    expect(detectCountryFromHeaders(makeRequest(TOR_COUNTRY))).toBe('');
  });

  it('returns lowercase country code for a valid header', () => {
    expect(detectCountryFromHeaders(makeRequest(ES.toUpperCase()))).toBe(ES);
  });

  it('lowercases already-lowercase codes', () => {
    expect(detectCountryFromHeaders(makeRequest('US'))).toBe('us');
  });
});

describe('detectCountryFromCDN', () => {
  beforeEach(() => {
    mockGetCloudflareContext.mockResolvedValue({ env: { NEXT_PUBLIC_SITE_URL: 'https://test.com' } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the country code parsed from the CDN trace', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(true, `fl=123\nloc=${ES.toUpperCase()}\nts=1234`)));
    expect(await detectCountryFromCDN()).toBe(ES);
  });

  it('lowercases the country code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(true, `loc=${DE.toUpperCase()}\n`)));
    expect(await detectCountryFromCDN()).toBe(DE);
  });

  it('returns empty string when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(false, '')));
    expect(await detectCountryFromCDN()).toBe('');
  });

  it('returns empty string when loc= line is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(true, 'fl=123\nts=456')));
    expect(await detectCountryFromCDN()).toBe('');
  });

  it('returns empty string when getCloudflareContext throws', async () => {
    mockGetCloudflareContext.mockRejectedValue(new Error('no context'));
    expect(await detectCountryFromCDN()).toBe('');
  });

  it('returns empty string when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    expect(await detectCountryFromCDN()).toBe('');
  });
});

describe('detectCountryFromIP', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the country from geo lookup on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(makeResponse(true, { ip: '1.2.3.4' }))
        .mockResolvedValueOnce(makeResponse(true, { country: FR.toUpperCase() }))
    );
    expect(await detectCountryFromIP()).toBe(FR);
  });

  it('returns empty string when ipify response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(false, {})));
    expect(await detectCountryFromIP()).toBe('');
  });

  it('returns empty string when ip field is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(makeResponse(true, {})));
    expect(await detectCountryFromIP()).toBe('');
  });

  it('returns empty string when ipinfo response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(makeResponse(true, { ip: '1.2.3.4' }))
        .mockResolvedValueOnce(makeResponse(false, {}))
    );
    expect(await detectCountryFromIP()).toBe('');
  });

  it('returns empty string when country field is absent from geo data', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(makeResponse(true, { ip: '1.2.3.4' }))
        .mockResolvedValueOnce(makeResponse(true, {}))
    );
    expect(await detectCountryFromIP()).toBe('');
  });

  it('returns empty string when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    expect(await detectCountryFromIP()).toBe('');
  });
});
