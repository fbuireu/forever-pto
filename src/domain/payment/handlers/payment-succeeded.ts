import type { TursoClient } from '@infrastructure/clients/db/turso/client';
import {
  getPaymentById,
  savePayment,
  updatePaymentStatus,
  updatePaymentCharge,
} from '@infrastructure/services/payments/repository';
import { extractChargeId, extractCustomerId } from '@infrastructure/services/payments/utils/helpers';
import type { PaymentSucceededEvent } from '../events/types';
import { createPaymentError } from '../errors';
import type Stripe from 'stripe';

interface HandlePaymentSucceededDeps {
  db: TursoClient;
  stripe: Stripe;
}

export const handlePaymentSucceeded = async (
  event: PaymentSucceededEvent,
  deps: HandlePaymentSucceededDeps
): Promise<void> => {
  console.log('Processing successful payment:', event.paymentId);

  try {
    const existingPayment = await getPaymentById(deps.db, event.paymentId);

    if (existingPayment.success && existingPayment.data) {
      await updateExistingPayment(event, deps.db);
    } else {
      await createPaymentFromWebhook(event, deps.db);
    }

    await updateChargeDetails(event, deps);

    console.log('Payment successfully processed:', event.paymentId);
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
};

const updateExistingPayment = async (event: PaymentSucceededEvent, db: TursoClient): Promise<void> => {
  const result = await updatePaymentStatus(db, event.paymentId, event.status);

  if (!result.success) {
    throw createPaymentError.updateStatusFailed(event.paymentId, result.error);
  }
};

const createPaymentFromWebhook = async (event: PaymentSucceededEvent, db: TursoClient): Promise<void> => {
  console.warn('Payment not found in DB, creating from webhook:', event.paymentId);

  const result = await savePayment(db, {
    id: event.paymentIntent.id,
    stripeCreatedAt: new Date(event.paymentIntent.created * 1000),
    customerId: extractCustomerId(event.paymentIntent.customer),
    chargeId: extractChargeId(event.paymentIntent.latest_charge),
    email: event.email,
    amount: event.amount,
    currency: event.paymentIntent.currency,
    status: event.status,
    paymentMethodType: event.paymentIntent.payment_method_types?.[0] || null,
    description: event.paymentIntent.description || null,
    promoCode: event.paymentIntent.metadata.promoCode || null,
  });

  if (!result.success) {
    throw createPaymentError.saveFromWebhookFailed(event.paymentId, result.error);
  }
};

const updateChargeDetails = async (event: PaymentSucceededEvent, deps: HandlePaymentSucceededDeps): Promise<void> => {
  if (!event.paymentIntent.latest_charge) return;

  const chargeId =
    typeof event.paymentIntent.latest_charge === 'string'
      ? event.paymentIntent.latest_charge
      : event.paymentIntent.latest_charge.id;

  try {
    const charge = await deps.stripe.charges.retrieve(chargeId);

    const result = await updatePaymentCharge(
      deps.db,
      event.paymentId,
      charge.id,
      charge.receipt_url,
      charge.payment_method_details?.type || null
    );

    if (!result.success) {
      console.error('Failed to update charge details:', result.error);
      // No lanzamos error porque no es crítico
    }
  } catch (error) {
    console.error('Error fetching charge details:', error);
    // No lanzamos error porque no es crítico
  }
};
