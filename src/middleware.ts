import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { detectLocation } from '@/infrastructure/services/location/detectLocation';
import { PAGES_ROUTES } from '@/const/const';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  if (searchParams.has('country')) {
    return NextResponse.next();
  }

  const country = await detectLocation(request);

  if(!country) {
    return NextResponse.next();
  }

  const newSearchParams = new URLSearchParams(searchParams.toString());

  newSearchParams.set('country', country);

  const newUrl = new URL(request.url);
  newUrl.search = newSearchParams.toString();

  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [PAGES_ROUTES.HOME],
};