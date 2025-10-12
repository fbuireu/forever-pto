import { handleStripeWebhook } from '@infrastructure/webhooks/stripe/service';
import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const result = await handleStripeWebhook(body, signature);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
