import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { detectCountryFromRequest } from './infrastructure/services/location';

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  if (searchParams.has('country')) {
    return NextResponse.next();
  }

  const detectedCountry = await detectCountryFromRequest(request);

  if (detectedCountry) {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    newSearchParams.set('country', detectedCountry);

    const newUrl = new URL(request.url);
    newUrl.search = newSearchParams.toString();

    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};