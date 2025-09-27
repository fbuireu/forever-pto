import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

const secret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
    const signature = (await headers()).get('stripe-signature');
    
  if (!signature || !secret) {
    return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
      await handleSuccessfulPayment(event.data.object);
  } else {
      console.log(`Unhandled event type: ${event.type}`);
  }

  return Response.json({ received: true });
}

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  const { email, type } = paymentIntent.metadata;
  const amount = paymentIntent.amount / 100;

  console.log(`Payment succeeded: €${amount} from ${email}`);

  try {
    // add to db
    // await addToPremiumDatabase({
    //   email,
    //   amount,
    //   stripePaymentId: paymentIntent.id,
    //   timestamp: new Date(),
    //   type: 'donation',
    // });

    console.log(`Added ${email} to premium users`);
  } catch (error) {
    console.error('Error adding to database:', error);
  }
}

async function addToPremiumDatabase(data: {
  email: string;
  amount: number;
  stripePaymentId: string;
  timestamp: Date;
  type: string;
}) {}
