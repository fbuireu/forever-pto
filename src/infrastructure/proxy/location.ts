import { detectCountry } from '@infrastructure/services/location/detectCountry';
import type { NextRequest, NextResponse } from 'next/server';
import { setLocationCookie } from './cookie';

interface MiddlewareParams {
  request: NextRequest;
  response: NextResponse;
}

export async function location({ request, response }: MiddlewareParams) {
  const userCountry = await detectCountry(request);

  if (userCountry) {
    setLocationCookie(response, userCountry);
  }

  return response;
}
