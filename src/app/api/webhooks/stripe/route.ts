import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const STRIPE_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
} as const;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        await handleSuccessfulPayment(event.data.object as Stripe.PaymentIntent);
        break;
      case STRIPE_EVENTS.PAYMENT_INTENT_FAILED:
        await handleFailedPayment(event.data.object as Stripe.PaymentIntent);
        break;
      default:
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;

  const paymentData = {
    stripePaymentId: paymentIntent.id,
    customerId:
      typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id || null,
    email: metadata.email,
    name: metadata.name || null,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    status: paymentIntent.status,
    type: metadata.type,
    method: 'stripe' as const,
    promoCode: metadata.promoCode || null,
    timestamp: metadata.timestamp || new Date(paymentIntent.created * 1000).toISOString(),
    createdAt: new Date(paymentIntent.created * 1000),
    userAgent: metadata.userAgent || null,
    ipAddress: metadata.ipAddress || null,
    description: paymentIntent.description || null,
    receiptUrl: null as string | null,
    chargeId: null as string | null,
  };

  try {
    if (paymentIntent.latest_charge) {
      const chargeId =
        typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : paymentIntent.latest_charge.id;

      const charge = await stripe.charges.retrieve(chargeId);
      paymentData.receiptUrl = charge.receipt_url;
      paymentData.chargeId = charge.id;
    }
  } catch (error) {
    console.error('Error fetching charge details:', error);
  }

  try {
    await saveDonationToDatabase(paymentData);
  } catch (error) {
    console.error('Error saving donation to database:', error);
    throw error;
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  const failureData = {
    stripePaymentId: paymentIntent.id,
    email: paymentIntent.metadata.email,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    status: paymentIntent.status,
    errorMessage: paymentIntent.last_payment_error?.message || 'Unknown error',
    errorCode: paymentIntent.last_payment_error?.code || null,
    timestamp: new Date().toISOString(),
  };

  console.error('Payment failed:', failureData);

  try {
    await saveFailedPaymentToDatabase(failureData);
  } catch (error) {
    console.error('Error saving failed payment:', error);
  }
}

async function saveDonationToDatabase(data: any) {
  console.log('Saving donation:', data);
}

async function saveFailedPaymentToDatabase(data: any) {
  console.log('Saving failed payment:', data);
}
