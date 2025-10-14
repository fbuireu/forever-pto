import { activateWithEmail, activateWithPayment } from '@application/use-cases/activate-premium';
import { verifySession } from '@application/use-cases/verify-session';
import { getTursoClient } from '@infrastructure/clients/db/turso/client';
import { getBetterStackClient } from '@infrastructure/clients/logging/better-stack/client';
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
  const logger = getBetterStackClient();
  logger.info('GET /api/check-session');

  const cookieStore = await cookies();
  const token = cookieStore.get(PREMIUM_COOKIE)?.value;

  if (!token) {
    logger.info('No premium token found in cookies');
    return NextResponse.json({ premiumKey: null, email: null });
  }

  const sessionRepository = createSessionRepository({ jwtSecret: getJWTSecret() });
  const verification = await verifySession(token, { sessionRepository });

  if (!verification.valid) {
    logger.warn('Invalid session token', {
      hasData: !!verification.data,
    });
    const response = NextResponse.json({ premiumKey: null, email: null });
    response.cookies.delete(PREMIUM_COOKIE);
    return response;
  }

  logger.info('Session verified successfully', {
    email: verification.data?.email,
    hasPaymentIntent: !!verification.data?.paymentIntentId,
  });

  return NextResponse.json({
    premiumKey: verification.data?.paymentIntentId ?? null,
    email: verification.data?.email ?? null,
  });
}

export async function POST(request: NextRequest) {
  const logger = getBetterStackClient();
  const requestId = crypto.randomUUID();
  const requestLogger = logger.withContext({
    requestId,
    method: request.method,
    path: '/api/check-session',
  });

  requestLogger.info('POST /api/check-session started');

  try {
    const body = await request.json();
    const { email, premiumKey } = body as { email?: string; premiumKey?: string };

    if (!email) {
      requestLogger.warn('Email missing in request body');
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const userLogger = requestLogger.withContext({
      email,
      hasPremiumKey: !!premiumKey,
    });

    userLogger.info('Processing premium activation');

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
      userLogger.info('Activating with payment intent', { premiumKey });
      result = await activateWithPayment({ email, paymentIntentId: premiumKey }, params);
    } else {
      userLogger.info('Checking existing payment for email');
      result = await activateWithEmail({ email }, params);
    }

    if (!result.success) {
      userLogger.warn('Premium activation failed', {
        error: result.error,
      });
      return NextResponse.json(
        {
          error: result.error,
          premiumKey: null,
        },
        { status: 400 }
      );
    }

    userLogger.info('Premium activated successfully', {
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

    requestLogger.info('POST /api/check-session completed successfully', {
      status: 200,
    });

    return response;
  } catch (error) {
    requestLogger.logError('POST /api/check-session failed', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
