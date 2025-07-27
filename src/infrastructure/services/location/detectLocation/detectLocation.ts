import { detectCountryFromCDN } from '@infrastructure/services/location/detectLocation/utils/detectCountryFromCDN/detectCountryFromCDN';
import { detectCountryFromIP } from '@infrastructure/services/location/detectLocation/utils/detectCountryFromIP/detectCountryFromIP';
import type { NextRequest } from 'next/server';
import { detectCountryFromHeaders } from './utils/detectCountryFromHeaders/detectCountryFromHeaders';

export async function detectLocation(request: NextRequest): Promise<string> {
  try {
    const cdnLocation = await detectCountryFromCDN();
    if (cdnLocation) return cdnLocation;
  } catch {
    return '';
  }

  return Promise.race([detectCountryFromHeaders(request), detectCountryFromIP()]);
}
