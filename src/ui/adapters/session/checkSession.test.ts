import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { verifyPremiumEmail, getExistingSession } = await import('./checkSession');

beforeEach(() => {
  mockFetch.mockReset();
});

describe('verifyPremiumEmail', () => {
  it('returns null when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    expect(await verifyPremiumEmail('user@example.com')).toBeNull();
  });

  it('returns null when premiumKey is absent in response', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) });

    expect(await verifyPremiumEmail('user@example.com')).toBeNull();
  });

  it('returns premiumKey when present', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ premiumKey: 'pk_abc' }),
    });

    expect(await verifyPremiumEmail('user@example.com')).toEqual({ premiumKey: 'pk_abc' });
  });

  it('sends email in request body', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    await verifyPremiumEmail('test@domain.com');

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(options.body as string)).toEqual({ email: 'test@domain.com' });
  });
});

describe('getExistingSession', () => {
  it('returns null when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    expect(await getExistingSession()).toBeNull();
  });

  it('returns null when premiumKey is absent in response', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ email: 'user@example.com' }) });

    expect(await getExistingSession()).toBeNull();
  });

  it('returns full SessionData when premiumKey is present', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ premiumKey: 'pk_abc', email: 'user@example.com' }),
    });

    expect(await getExistingSession()).toEqual({ premiumKey: 'pk_abc', email: 'user@example.com' });
  });

  it('uses a GET request with credentials included', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    await getExistingSession();

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/check-session');
    expect(options).toEqual({ credentials: 'include' });
  });
});
