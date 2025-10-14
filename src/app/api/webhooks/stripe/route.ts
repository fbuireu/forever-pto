import { handleStripeWebhook } from '@infrastructure/webhooks/stripe/service';
import { withBetterStack, type BetterStackRequest } from '@logtail/next';
import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export const POST = withBetterStack(async (req: BetterStackRequest & NextRequest) => {
  req.log.info('POST /stripe-webhook called');

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    req.log.error('Missing stripe signature in webhook request');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  req.log.info('Processing Stripe webhook', {
    hasSignature: true,
    bodyLength: body.length,
  });

  const result = await handleStripeWebhook(body, signature);

  if (!result.success) {
    req.log.error('Stripe webhook handling failed', {
      error: result.error,
    });
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  req.log.info('Stripe webhook processed successfully');

  return NextResponse.json({ received: true });
});
