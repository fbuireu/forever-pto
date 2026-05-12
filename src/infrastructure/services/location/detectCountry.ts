import { detectCountryFromCDN } from '@infrastructure/services/location/utils/detectCountryFromCDN';
import type { NextRequest } from 'next/server';
import { detectCountryFromHeaders } from './utils/detectCountryFromHeaders';
import { detectCountryFromIP } from './utils/detectCountryFromIP';

export async function detectCountry(request: NextRequest): Promise<string> {
  const cdnLocation = await detectCountryFromCDN();
  if (cdnLocation) return cdnLocation;

  const fromHeaders = detectCountryFromHeaders(request);
  if (fromHeaders) return fromHeaders;

  return detectCountryFromIP();
}
