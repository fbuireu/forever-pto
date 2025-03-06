import type { NextRequest } from 'next/server';
import { detectCountryFromHeaders } from '@/infrastructure/services/location/utils/detectCountryFromHeaders';
import { detectCountryFromCDN } from '@/infrastructure/services/location/utils/detectCountryFromCDN';
import { detectCountryFromIP } from '@/infrastructure/services/location/utils/detectCountryFromIP';

export async function detectLocation(request: NextRequest): Promise<string> {
  try {
    return await Promise.race([
      detectCountryFromHeaders(request),
      detectCountryFromIP(),
      detectCountryFromCDN()
    ]);
  } catch (error) {
    console.warn('Error en detectCountryFromRequest:', error);
    return '';
  }
}