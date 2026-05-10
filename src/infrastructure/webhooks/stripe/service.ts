import { AppLayer } from '@infrastructure/layers';
import { processWebhookEvent } from '@infrastructure/webhooks/processor';
import { Effect } from 'effect';
import StripeNode from 'stripe';

export interface WebhookServiceResult {
  success: boolean;
  error?: string;
  isSignatureError?: boolean;
}

export const handleStripeWebhook = async (body: string, signature: string): Promise<WebhookServiceResult> => {
  let event: StripeNode.Event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    const stripe = new StripeNode(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2026-04-22.dahlia',
    });
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const isSignatureError = error instanceof StripeNode.errors.StripeSignatureVerificationError;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed',
      isSignatureError,
    };
  }

  return Effect.runPromise(
    processWebhookEvent(event).pipe(
      Effect.map(() => ({ success: true }) as WebhookServiceResult),
      Effect.provide(AppLayer),
      Effect.catchAll(() => Effect.succeed({ success: false, error: 'Webhook processing failed' }))
    )
  );
};
