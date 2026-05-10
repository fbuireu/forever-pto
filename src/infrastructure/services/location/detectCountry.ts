import { detectCountryFromCDN } from '@infrastructure/services/location/utils/detectCountryFromCDN';
import type { NextRequest } from 'next/server';
import { detectCountryFromHeaders } from './utils/detectCountryFromHeaders';
import { detectCountryFromIP } from './utils/detectCountryFromIP';

export async function detectCountry(request: NextRequest): Promise<string> {
  try {
    const cdnLocation = await detectCountryFromCDN();
    if (cdnLocation) return cdnLocation;
  } catch {}

  const results = await Promise.allSettled([
    detectCountryFromHeaders(request),
    detectCountryFromIP(),
  ]);

  const found = results.find((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value);
  return found?.value ?? '';
}
