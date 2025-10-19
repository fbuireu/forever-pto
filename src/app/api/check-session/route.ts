import { activateWithEmail, activateWithPayment } from '@application/use-cases/activate-premium';
import { verifySession } from '@application/use-cases/verify-session';
import { getTursoClientInstance } from '@infrastructure/clients/db/turso/client';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
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

async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const logger = getBetterStackInstance();
  const requestId = crypto.randomUUID();

  const requestLogger = logger.withContext({
    requestId,
    method: 'GET',
    path: '/api/check-session',
    userAgent: request.headers.get('user-agent') ?? 'unknown',
    origin: request.headers.get('origin') ?? 'unknown',
  });

  requestLogger.info('GET /api/check-session - Session check started');

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PREMIUM_COOKIE)?.value;

    if (!token) {
      const duration = performance.now() - startTime;
      requestLogger.info('GET /api/check-session - No premium token found', {
        duration_ms: duration,
        outcome: 'no_token',
        statusCode: 200,
      });
      return NextResponse.json({ premiumKey: null, email: null });
    }

    requestLogger.info('GET /api/check-session - Token found, verifying session', {
      tokenPrefix: token.slice(0, 10) + '...',
    });

    const sessionRepository = createSessionRepository({ jwtSecret: getJWTSecret() });

    const verifyStart = performance.now();
    const verification = await verifySession(token, { sessionRepository });
    const verifyDuration = performance.now() - verifyStart;

    if (!verification.valid) {
      const duration = performance.now() - startTime;
      requestLogger.warn('GET /api/check-session - Invalid session token', {
        hasData: !!verification.data,
        verifyDuration_ms: verifyDuration,
        duration_ms: duration,
        outcome: 'invalid_token',
        statusCode: 200,
      });

      const response = NextResponse.json({ premiumKey: null, email: null });
      response.cookies.delete(PREMIUM_COOKIE);
      return response;
    }

    const duration = performance.now() - startTime;
    requestLogger.info('GET /api/check-session - Session verified successfully', {
      email: verification.data?.email,
      hasPaymentIntent: !!verification.data?.paymentIntentId,
      verifyDuration_ms: verifyDuration,
      duration_ms: duration,
      outcome: 'success',
      statusCode: 200,
    });

    return NextResponse.json({
      premiumKey: verification.data?.paymentIntentId ?? null,
      email: verification.data?.email ?? null,
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    requestLogger.logError('GET /api/check-session - Request failed', error, {
      duration_ms: duration,
      outcome: 'error',
      statusCode: 500,
    });

    return NextResponse.json({ error: 'Internal error', premiumKey: null, email: null }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const logger = getBetterStackInstance();
  const requestId = crypto.randomUUID();

  const requestLogger = logger.withContext({
    requestId,
    method: 'POST',
    path: '/api/check-session',
    userAgent: request.headers.get('user-agent') ?? 'unknown',
    origin: request.headers.get('origin') ?? 'unknown',
    contentType: request.headers.get('content-type') ?? 'unknown',
  });

  requestLogger.info('POST /api/check-session - Premium activation request started');

  try {
    const body = await request.json();
    const { email, premiumKey } = body as { email?: string; premiumKey?: string };

    if (!email) {
      const duration = performance.now() - startTime;
      requestLogger.warn('POST /api/check-session - Email missing in request body', {
        duration_ms: duration,
        outcome: 'validation_error',
        bodyKeys: Object.keys(body),
        statusCode: 400,
      });
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const emailHash = await hashEmail(email);
    const emailDomain = email.split('@')[1];

    const userLogger = requestLogger.withContext({
      emailDomain,
      emailHash,
      hasPremiumKey: !!premiumKey,
      activationType: premiumKey ? 'with_payment_intent' : 'existing_payment',
    });

    userLogger.info('POST /api/check-session - Processing premium activation', {
      emailDomain,
      activationType: premiumKey ? 'with_payment_intent' : 'existing_payment',
    });

    const stripe = getStripeServerInstance();
    const turso = getTursoClientInstance();
    const sessionRepository = createSessionRepository({ jwtSecret: getJWTSecret() });
    const paymentValidator = createPaymentValidator(stripe);
    const paymentRepository = createPaymentRepository(turso);

    const params = {
      sessionRepository,
      paymentValidator,
      paymentRepository,
    };

    let result;
    const activationStart = performance.now();

    if (premiumKey) {
      const premiumKeyPrefix = premiumKey.slice(0, 8);
      userLogger.info('POST /api/check-session - Activating with payment intent', {
        premiumKeyPrefix: premiumKeyPrefix + '...',
      });

      try {
        result = await activateWithPayment({ email, paymentIntentId: premiumKey }, params);
        const activationDuration = performance.now() - activationStart;

        userLogger.info('POST /api/check-session - Payment activation completed', {
          activationDuration_ms: activationDuration,
          success: result.success,
        });
      } catch (error) {
        const activationDuration = performance.now() - activationStart;
        userLogger.logError('POST /api/check-session - Payment activation failed', error, {
          activationDuration_ms: activationDuration,
          premiumKeyPrefix: premiumKeyPrefix + '...',
        });
        throw error;
      }
    } else {
      userLogger.info('POST /api/check-session - Checking existing payment for email');

      try {
        result = await activateWithEmail({ email }, params);
        const activationDuration = performance.now() - activationStart;

        userLogger.info('POST /api/check-session - Email activation completed', {
          activationDuration_ms: activationDuration,
          success: result.success,
        });
      } catch (error) {
        const activationDuration = performance.now() - activationStart;
        userLogger.logError('POST /api/check-session - Email activation failed', error, {
          activationDuration_ms: activationDuration,
        });
        throw error;
      }
    }

    if (!result.success) {
      const duration = performance.now() - startTime;
      userLogger.warn('POST /api/check-session - Premium activation failed', {
        error: result.error,
        duration_ms: duration,
        outcome: 'activation_failed',
        statusCode: 400,
      });

      return NextResponse.json(
        {
          error: result.error,
          premiumKey: null,
        },
        { status: 400 }
      );
    }

    const duration = performance.now() - startTime;
    const resultPremiumKeyPrefix = result.premiumKey ? result.premiumKey.slice(0, 8) + '...' : 'none';

    userLogger.info('POST /api/check-session - Premium activated successfully', {
      premiumKeyPrefix: resultPremiumKeyPrefix,
      duration_ms: duration,
      outcome: 'success',
      cookieSet: true,
      statusCode: 200,
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
    const duration = performance.now() - startTime;
    requestLogger.logError('POST /api/check-session - Request failed with exception', error, {
      duration_ms: duration,
      outcome: 'error',
      statusCode: 500,
    });

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
