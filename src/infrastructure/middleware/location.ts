import { detectCountry } from '@infrastructure/services/location/detectCountry';
import type { NextRequest, NextResponse } from 'next/server';

interface MiddlewareParams {
  request: NextRequest;
  response: NextResponse;
}

export async function location({ request, response }: MiddlewareParams): Promise<NextResponse> {
  const userCountry = await detectCountry(request);
  const userCountryCookie = request.cookies.get('user-country')?.value;

  if (userCountry && userCountry !== userCountryCookie) {
    response.cookies.set('user-country', userCountry, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  }

  return response;
}
