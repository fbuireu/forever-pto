import { activateWithEmail, activateWithPayment } from '@application/use-cases/premium/activate';
import { verifySession } from '@application/use-cases/premium/verify';
import { getTursoClient } from '@infrastructure/clients/db/turso/client';
import { getStripeServerInstance } from '@infrastructure/clients/payments/stripe/client';
import { createPaymentValidator } from '@infrastructure/services/payments/provider/validate-payment-intent';
import { createPaymentRepository } from '@infrastructure/services/payments/repository';
import { createSessionRepository } from '@infrastructure/services/premium/repository';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PREMIUM_COOKIE = 'premium-token';
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
const isProd = process.env.NODE_ENV === 'production';

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PREMIUM_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ premiumKey: null, email: null });
  }

  const sessionRepository = createSessionRepository({ jwtSecret: getJWTSecret() });
  const verification = await verifySession(token, { sessionRepository });

  if (!verification.valid) {
    const response = NextResponse.json({ premiumKey: null, email: null });
    response.cookies.delete(PREMIUM_COOKIE);
    return response;
  }

  return NextResponse.json({
    premiumKey: verification.data?.paymentIntentId || null,
    email: verification.data?.email || null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, premiumKey } = body as { email?: string; premiumKey?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const stripe = getStripeServerInstance();
    const turso = getTursoClient();
    const sessionRepository = createSessionRepository({ jwtSecret: getJWTSecret() });
    const paymentValidator = createPaymentValidator(stripe);
    const paymentRepository = createPaymentRepository(turso);

    const deps = {
      sessionRepository,
      paymentValidator,
      paymentRepository,
    };

    let result;

    if (premiumKey) {
      console.log(`Activating premium for ${email} with payment ${premiumKey}`);
      result = await activateWithPayment({ email, paymentIntentId: premiumKey }, deps);
    } else {
      console.log(`Checking existing payment for ${email}`);
      result = await activateWithEmail({ email }, deps);
    }

    if (!result.success) {
      console.log(`Premium activation failed: ${result.error}`);
      return NextResponse.json(
        {
          error: result.error,
          premiumKey: null,
        },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      premiumKey: result.premiumKey,
      email: result.email,
    });

    response.cookies.set(PREMIUM_COOKIE, result.token!, {
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
