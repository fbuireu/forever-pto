import { processWebhookEvent } from '@application/use-cases/webhook';
import { ApiError } from '@infrastructure/api/errors';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
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
      Effect.provide(ApplicationLayer),
      Effect.catchTag('WebhookError', (e) =>
        Effect.succeed(
          NextResponse.json(
            { error: e.isSignatureError ? ApiError.INVALID_SIGNATURE : ApiError.WEBHOOK_PROCESSING_FAILED },
            { status: e.isSignatureError ? 400 : 500 },
          ),
        ),
      ),
      Effect.catchAll(() =>
        Effect.succeed(NextResponse.json({ error: ApiError.WEBHOOK_PROCESSING_FAILED }, { status: 500 })),
      ),
    ),
  );
}
