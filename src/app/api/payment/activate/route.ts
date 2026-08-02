import { activateWithPayment } from '@application/use-cases/activatePremium';
import { LOCALES } from '@infrastructure/i18n/locales';
import { routing } from '@infrastructure/i18n/routing';
import { localePath } from '@infrastructure/i18n/utils/url';
import { ApplicationLayer } from '@infrastructure/layers';
import { checkRateLimit } from '@infrastructure/services/payments/rateLimit';
import { ACTIVATION_FAILED, ACTIVATION_PARAM } from '@infrastructure/services/premium/activation';
import { setPremiumCookie } from '@infrastructure/services/premium/cookie';
import { Effect } from 'effect';
import { hasLocale } from 'next-intl';
import { after, type NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const SUCCEEDED_REDIRECT_STATUS: Stripe.PaymentIntent.Status = 'succeeded';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const paymentIntentId = searchParams.get('payment_intent');
  const clientSecret = searchParams.get('payment_intent_client_secret');
  const redirectStatus = searchParams.get('redirect_status');
  const requested = searchParams.get('locale');
  const locale = hasLocale(LOCALES, requested) ? requested : routing.defaultLocale;

  const destination = new URL(localePath(locale, '/payment/confirmation'), origin);
  if (paymentIntentId) destination.searchParams.set('payment_intent', paymentIntentId);

  const redirectTo = (activated: boolean) => {
    if (!activated) destination.searchParams.set(ACTIVATION_PARAM, ACTIVATION_FAILED);
    const response = NextResponse.redirect(destination);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  };

  if (!paymentIntentId || !clientSecret) return redirectTo(false);
  if (redirectStatus && redirectStatus !== SUCCEEDED_REDIRECT_STATUS) return redirectTo(false);

  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';

  const activation = await Effect.runPromise(
    checkRateLimit(ip).pipe(
      Effect.andThen(() => activateWithPayment({ paymentIntentId, clientSecret })),
      Effect.catchAll(() => Effect.succeed(null)),
      Effect.provide(ApplicationLayer)
    )
  );

  if (!activation) return redirectTo(false);

  const response = redirectTo(true);
  setPremiumCookie(response, activation.token);

  after(() => Effect.runPromise(activation.deferred.pipe(Effect.provide(ApplicationLayer))));

  return response;
}
