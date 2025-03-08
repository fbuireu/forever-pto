import { detectCountryFromCDN } from '@/infrastructure/services/location/utils/detectCountryFromCDN';
import { detectCountryFromHeaders } from '@/infrastructure/services/location/utils/detectCountryFromHeaders';
import { detectCountryFromIP } from '@/infrastructure/services/location/utils/detectCountryFromIP';
import type { NextRequest } from 'next/server';

export async function detectLocation(request: NextRequest): Promise<string> {
  try {
    return await Promise.race([detectCountryFromHeaders(request), detectCountryFromIP(), detectCountryFromCDN()]);
  } catch (error) {
    return '';
  }
}
