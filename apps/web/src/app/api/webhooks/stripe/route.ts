import { processWebhookEvent } from '@application/use-cases/webhook';
import { ApiError } from '@infrastructure/api/errors';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import {
  isWebhookConfigurationError,
  StripeServerService,
} from '@infrastructure/clients/payments/stripe/serverService';
import { ApplicationLayer } from '@infrastructure/layers';
import { Effect } from 'effect';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const [body, headersList] = await Promise.all([request.text(), headers()]);
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: ApiError.MISSING_SIGNATURE }, { status: 400 });
  }

  return Effect.runPromise(
    Effect.gen(function* () {
      const stripe = yield* StripeServerService;
      const event = yield* stripe.webhooks.constructEvent(body, signature);
      yield* processWebhookEvent(event);
      return NextResponse.json({ received: true });
    }).pipe(
      Effect.catchTag('WebhookError', (e): Effect.Effect<NextResponse, never, LoggerService> => {
        const { isSignatureError } = e;

        if (!isWebhookConfigurationError(e)) {
          return Effect.succeed(
            NextResponse.json(
              { error: isSignatureError ? ApiError.INVALID_SIGNATURE : ApiError.WEBHOOK_PROCESSING_FAILED },
              { status: isSignatureError ? 400 : 500 }
            )
          );
        }

        return Effect.gen(function* () {
          const logger = yield* LoggerService;
          logger.logError('Stripe webhook is misconfigured, rejecting the delivery as non-retryable', e);

          return NextResponse.json({ error: ApiError.WEBHOOK_MISCONFIGURED }, { status: 400 });
        });
      }),
      Effect.provide(ApplicationLayer),
      Effect.catchAll(() =>
        Effect.succeed(NextResponse.json({ error: ApiError.WEBHOOK_PROCESSING_FAILED }, { status: 500 }))
      )
    )
  );
}
