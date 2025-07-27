import { detectCountryFromCDN } from '@infrastructure/services/location/utils/detectCountryFromCDN';
import type { NextRequest } from 'next/server';
import { detectCountryFromHeaders } from './utils/detectCountryFromHeaders';
import { detectCountryFromIP } from './utils/detectCountryFromIP';

export async function detectLocation(request: NextRequest): Promise<string> {
  try {
      const cdnLocation = await detectCountryFromCDN();

    if (cdnLocation) return cdnLocation;
  } catch {}

   return await Promise.race([
    detectCountryFromHeaders(request),
    detectCountryFromIP()
  ]);
}