import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PREMIUM_COOKIE = 'premium-token';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(PREMIUM_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ premiumKey: null });
    } 

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      premiumKey: payload.premium,
      email: payload.email,
    });
  } catch (error) {
    const response = NextResponse.json({ premiumKey: null });
    response.cookies.delete(PREMIUM_COOKIE);
    return response;
  }
}
