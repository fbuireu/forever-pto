import { getTursoClient } from '@infrastructure/clients/db/turso/client';
import {
  savePayment,
  updatePaymentCharge,
  updatePaymentStatus,
  getPaymentById,
} from '@infrastructure/services/payments/repository';
import { extractChargeId, extractCustomerId } from '@infrastructure/services/payments/utils/helpers';
import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const turso = getTursoClient();

const STRIPE_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  CHARGE_SUCCEEDED: 'charge.succeeded',
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
      case STRIPE_EVENTS.CHARGE_SUCCEEDED:
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing successful payment:', paymentIntent.id);

  try {
    const existingPayment = await getPaymentById(turso, paymentIntent.id);

    if (existingPayment.success && existingPayment.data) {
      const updateResult = await updatePaymentStatus(turso, paymentIntent.id, paymentIntent.status);

      if (!updateResult.success) {
        console.error('Failed to update payment status:', updateResult.error);
        throw new Error('Failed to update payment status');
      }
    } else {
      console.warn('Payment not found in DB, creating from webhook:', paymentIntent.id);
      const metadata = paymentIntent.metadata;

      const saveResult = await savePayment(turso, {
        id: paymentIntent.id,
        stripeCreatedAt: new Date(paymentIntent.created * 1000),
        customerId: extractCustomerId(paymentIntent.customer),
        chargeId: extractChargeId(paymentIntent.latest_charge),
        email: metadata.email || paymentIntent.receipt_email || '',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentMethodType: paymentIntent.payment_method_types?.[0] || null,
        description: paymentIntent.description || null,
        promoCode: metadata.promoCode || null,
      });

      if (!saveResult.success) {
        console.error('Failed to save payment from webhook:', saveResult.error);
        throw new Error('Failed to save payment');
      }
    }

    if (paymentIntent.latest_charge) {
      const chargeId =
        typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : paymentIntent.latest_charge.id;

      try {
        const charge = await stripe.charges.retrieve(chargeId);

        const chargeUpdateResult = await updatePaymentCharge(
          turso,
          paymentIntent.id,
          charge.id,
          charge.receipt_url,
          charge.payment_method_details?.type || null
        );

        if (!chargeUpdateResult.success) {
          console.error('Failed to update charge details:', chargeUpdateResult.error);
        }
      } catch (error) {
        console.error('Error fetching charge details:', error);
      }
    }

    console.log('Payment successfully processed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing failed payment:', paymentIntent.id);

  try {
    const updateResult = await updatePaymentStatus(turso, paymentIntent.id, paymentIntent.status);

    if (!updateResult.success) {
      console.error('Failed to update failed payment:', updateResult.error);
      throw new Error('Failed to update failed payment');
    }

    const errorInfo = {
      paymentIntentId: paymentIntent.id,
      email: paymentIntent.metadata.email,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      errorMessage: paymentIntent.last_payment_error?.message || 'Unknown error',
      errorCode: paymentIntent.last_payment_error?.code || null,
    };

    console.error('Payment failed details:', errorInfo);
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  console.log('Processing charge succeeded:', charge.id);

  try {
    const paymentIntentId =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id || null;

    if (!paymentIntentId) {
      console.error('No payment intent ID found in charge');
      return;
    }

    const updateResult = await updatePaymentCharge(
      turso,
      paymentIntentId,
      charge.id,
      charge.receipt_url,
      charge.payment_method_details?.type || null
    );

    if (!updateResult.success) {
      console.error('Failed to update charge info:', updateResult.error);
    } else {
      console.log('Charge info updated successfully:', charge.id);
    }
  } catch (error) {
    console.error('Error handling charge succeeded:', error);
  }
}
