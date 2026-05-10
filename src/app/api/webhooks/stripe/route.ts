import { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import { AppLayer } from '@infrastructure/layers';
import { processWebhookEvent } from '@infrastructure/webhooks/processor';
import { Effect } from 'effect';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  return Effect.runPromise(
    Effect.gen(function* () {
      const stripe = yield* StripeServerService;
      const event = yield* stripe.webhooks.constructEvent(body, signature);
      yield* processWebhookEvent(event);
      return NextResponse.json({ received: true });
    }).pipe(
      Effect.provide(AppLayer),
      Effect.catchTag('WebhookError', (e) =>
        Effect.succeed(
          NextResponse.json(
            { error: e.isSignatureError ? 'Invalid signature' : 'Webhook processing failed' },
            { status: e.isSignatureError ? 400 : 500 }
          )
        )
      ),
      Effect.catchAll(() => Effect.succeed(NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })))
    )
  );
}
