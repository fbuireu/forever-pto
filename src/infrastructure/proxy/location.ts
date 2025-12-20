import { detectCountry } from '@infrastructure/services/location/detectCountry';
import type { NextRequest, NextResponse } from 'next/server';

interface MiddlewareParams {
  request: NextRequest;
  response: NextResponse;
}

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function location({ request, response }: MiddlewareParams): Promise<NextResponse> {
  const userCountry = await detectCountry(request);

  if (userCountry) {
    response.cookies.set('user-country', userCountry, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: ONE_WEEK,
      path: '/',
    });
  }

  return response;
}
