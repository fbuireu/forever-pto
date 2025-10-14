import { activateWithEmail, activateWithPayment } from '@application/use-cases/activate-premium';
import { verifySession } from '@application/use-cases/verify-session';
import { getTursoClient } from '@infrastructure/clients/db/turso/client';
import { getStripeServerInstance } from '@infrastructure/clients/payments/stripe/client';
import { createPaymentValidator } from '@infrastructure/services/payments/provider/validate-payment-intent';
import { createPaymentRepository } from '@infrastructure/services/payments/repository';
import { createSessionRepository } from '@infrastructure/services/premium/repository';
import { withBetterStack, type BetterStackRequest } from '@logtail/next';
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

export const GET = withBetterStack(async (req: BetterStackRequest) => {
  req.log.info('GET /check-session called');

  const cookieStore = await cookies();
  const token = cookieStore.get(PREMIUM_COOKIE)?.value;

  if (!token) {
    req.log.info('No premium token found in cookies');
    return NextResponse.json({ premiumKey: null, email: null });
  }

  const sessionRepository = createSessionRepository({ jwtSecret: getJWTSecret() });
  const verification = await verifySession(token, { sessionRepository });

  if (!verification.valid) {
    req.log.warn('Invalid session token', { hasData: !!verification.data });
    const response = NextResponse.json({ premiumKey: null, email: null });
    response.cookies.delete(PREMIUM_COOKIE);
    return response;
  }

  req.log.info('Session verified successfully', {
    email: verification.data?.email,
    hasPaymentIntent: !!verification.data?.paymentIntentId,
  });

  return NextResponse.json({
    premiumKey: verification.data?.paymentIntentId ?? null,
    email: verification.data?.email ?? null,
  });
});

export const POST = withBetterStack(async (req: BetterStackRequest & NextRequest) => {
  req.log.info('POST /check-session called');

  try {
    const body = await req.json();
    const { email, premiumKey } = body as { email?: string; premiumKey?: string };

    if (!email) {
      req.log.warn('Email missing in request body');
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const log = req.log.with({ email, hasPremiumKey: !!premiumKey });
    log.info('Processing premium activation request');

    const stripe = getStripeServerInstance();
    const turso = getTursoClient();
    const sessionRepository = createSessionRepository({ jwtSecret: getJWTSecret() });
    const paymentValidator = createPaymentValidator(stripe);
    const paymentRepository = createPaymentRepository(turso);

    const params = {
      sessionRepository,
      paymentValidator,
      paymentRepository,
    };

    let result;

    if (premiumKey) {
      log.info('Activating with payment intent', { premiumKey });
      result = await activateWithPayment({ email, paymentIntentId: premiumKey }, params);
    } else {
      log.info('Checking existing payment for email');
      result = await activateWithEmail({ email }, params);
    }

    if (!result.success) {
      log.warn('Premium activation failed', { error: result.error });
      return NextResponse.json(
        {
          error: result.error,
          premiumKey: null,
        },
        { status: 400 }
      );
    }

    log.info('Premium activated successfully', {
      premiumKey: result.premiumKey,
    });

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
    req.log.error('Error in check-session POST', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
});
