import { getTursoClient } from '@infrastructure/clients/db/turso/client';
import { getPaymentByEmail } from '@infrastructure/services/payments/repository';
import { JWTPayload, jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PREMIUM_COOKIE = 'premium-token';
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
const isProd = process.env.NODE_ENV === 'production';

const getJWTSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyPremiumToken(token: string): Promise<
  | { valid: true; data: JWTPayload }
  | { valid: false; data: null }
> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    return {
      valid: true,
      data: {
        email: payload.email as string,
        paymentIntentId: payload.paymentIntentId as string,
      },
    };
  } catch {
    return { valid: false, data: null };
  }
}

async function createPremiumToken(email: string, paymentIntentId: string): Promise<string> {
  return await new SignJWT({
    email,
    paymentIntentId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJWTSecret());
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PREMIUM_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ premiumKey: null, email: null });
  }

  const verification = await verifyPremiumToken(token);
  console.log('VEEEEE', verification);
  if (!verification.valid) {
    const response = NextResponse.json({ premiumKey: null, email: null });
    response.cookies.delete(PREMIUM_COOKIE);
    return response;
  }

  return NextResponse.json({
    premiumKey: verification.data.paymentIntentId,
    email: verification.data.email,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, premiumKey } = body as { email?: string; premiumKey?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    let paymentIntentId: string;

    if (premiumKey) {
      paymentIntentId = premiumKey;
      console.log(`Activating premium for ${email} with payment ${premiumKey}`);
    } else {
      const turso = getTursoClient();
      const paymentResult = await getPaymentByEmail(turso, email);

      if (!paymentResult.success || !paymentResult.data) {
        console.log(`No successful payment found for ${email}`);
        return NextResponse.json({ premiumKey: null });
      }

      const payment = paymentResult.data;

      if (payment.status !== 'succeeded') {
        console.log(`Payment for ${email} has status ${payment.status}`);
        return NextResponse.json({ premiumKey: null });
      }

      paymentIntentId = payment.id;
      console.log(`Found existing premium for ${email} with payment ${paymentIntentId}`);
    }

    const token = await createPremiumToken(email, paymentIntentId);

    const response = NextResponse.json({
      success: true,
      premiumKey: paymentIntentId,
      email,
    });

    response.cookies.set(PREMIUM_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: THIRTY_DAYS_IN_SECONDS,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error in check-session POST:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
