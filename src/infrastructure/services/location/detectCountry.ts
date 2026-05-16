import type { NextRequest } from 'next/server';
import { detectCountryFromCDN, detectCountryFromHeaders, detectCountryFromIP } from './utils/strategies';

export async function detectCountry(request: NextRequest) {
  const cdnLocation = await detectCountryFromCDN();
  if (cdnLocation) return cdnLocation;

  const fromHeaders = detectCountryFromHeaders(request);
  if (fromHeaders) return fromHeaders;

  return detectCountryFromIP();
}
