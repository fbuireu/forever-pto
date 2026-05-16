import { describe, expect, it, vi } from 'vitest';

const mockDetectCountryFromCDN = vi.hoisted(() => vi.fn<() => Promise<string>>());
const mockDetectCountryFromHeaders = vi.hoisted(() => vi.fn<() => string>());
const mockDetectCountryFromIP = vi.hoisted(() => vi.fn<() => Promise<string>>());

vi.mock('./utils/strategies', () => ({
  detectCountryFromCDN: mockDetectCountryFromCDN,
  detectCountryFromHeaders: mockDetectCountryFromHeaders,
  detectCountryFromIP: mockDetectCountryFromIP,
}));

const { detectCountry } = await import('./detectCountry');

const mockRequest = {} as never;

describe('detectCountry', () => {
  it('returns the CDN result when non-empty', async () => {
    mockDetectCountryFromCDN.mockResolvedValue('es');
    expect(await detectCountry(mockRequest)).toBe('es');
    expect(mockDetectCountryFromHeaders).not.toHaveBeenCalled();
    expect(mockDetectCountryFromIP).not.toHaveBeenCalled();
  });

  it('falls back to headers when CDN returns empty', async () => {
    mockDetectCountryFromCDN.mockResolvedValue('');
    mockDetectCountryFromHeaders.mockReturnValue('de');
    expect(await detectCountry(mockRequest)).toBe('de');
    expect(mockDetectCountryFromIP).not.toHaveBeenCalled();
  });

  it('falls back to IP when CDN and headers both return empty', async () => {
    mockDetectCountryFromCDN.mockResolvedValue('');
    mockDetectCountryFromHeaders.mockReturnValue('');
    mockDetectCountryFromIP.mockResolvedValue('fr');
    expect(await detectCountry(mockRequest)).toBe('fr');
  });

  it('returns empty string when all strategies fail', async () => {
    mockDetectCountryFromCDN.mockResolvedValue('');
    mockDetectCountryFromHeaders.mockReturnValue('');
    mockDetectCountryFromIP.mockResolvedValue('');
    expect(await detectCountry(mockRequest)).toBe('');
  });
});
