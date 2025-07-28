import { detectCountryFromCDN } from '@infrastructure/services/location/utils/detectCountryFromCDN';
import type { NextRequest } from 'next/server';
import { detectCountryFromHeaders } from './utils/detectCountryFromHeaders';
import { detectCountryFromIP } from './utils/detectCountryFromIP';

export async function detectCountry(request: NextRequest): Promise<string> {
  try {
    const cdnLocation = await detectCountryFromCDN();
    if (cdnLocation) return cdnLocation;
  } catch {}

  const [headerLocation, ipLocation] = await Promise.allSettled([
    detectCountryFromHeaders(request),
    detectCountryFromIP(),
  ]);

  if (headerLocation.status === 'fulfilled' && headerLocation.value) {
    return headerLocation.value;
  }

  if (ipLocation.status === 'fulfilled' && ipLocation.value) {
    return ipLocation.value;
  }

  return '';
}
