import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { handleStripeWebhook } from '@infrastructure/webhooks/stripe/service';
import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

const logger = getBetterStackInstance();

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const webhookLogger = logger.withContext({
    requestId,
    webhook: 'stripe',
    path: '/api/webhooks/stripe',
  });

  webhookLogger.info('Stripe webhook received');

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    webhookLogger.error('Missing stripe signature');
    await webhookLogger.flush();
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  webhookLogger.info('Processing Stripe webhook', {
    hasSignature: true,
    bodyLength: body.length,
  });

  const result = await handleStripeWebhook(body, signature);

  if (!result.success) {
    webhookLogger.error('Stripe webhook handling failed', {
      error: result.error,
    });
    await webhookLogger.flush();
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  webhookLogger.info('Stripe webhook processed successfully');
  await webhookLogger.flush();

  return NextResponse.json({ received: true });
}
