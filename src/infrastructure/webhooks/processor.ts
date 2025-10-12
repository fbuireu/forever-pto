import { handlePaymentSucceeded } from '@domain/payment/handlers/payment-succeeded';
import { handlePaymentFailed } from '@domain/payment/handlers/payment-failed';
import { handleChargeSucceeded } from '@domain/payment/handlers/charge-succeeded';
import { createPaymentRepository } from '@infrastructure/services/payments/repository';
import { createChargeService } from '@infrastructure/services/payments/provider/charge-service';
import { getTursoClient } from '@infrastructure/clients/db/turso/client';
import { getStripeServerInstance } from '@infrastructure/clients/payments/stripe/client';
import type Stripe from 'stripe';
import { createPaymentSucceededEvent, createPaymentFailedEvent, createChargeSucceededEvent } from '@domain/payment/events/factory/events';

  const turso = getTursoClient();
  const stripe = getStripeServerInstance();

export const processWebhookEvent = async (event: Stripe.Event): Promise<void> => {
  const paymentRepository = createPaymentRepository(turso);
  const chargeService = createChargeService(stripe);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentEvent = createPaymentSucceededEvent(event.data.object);
      await handlePaymentSucceeded(paymentEvent, { paymentRepository, chargeService });
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentEvent = createPaymentFailedEvent(event.data.object);
      await handlePaymentFailed(paymentEvent, { paymentRepository });
      break;
    }

    case 'charge.succeeded': {
      const chargeEvent = createChargeSucceededEvent(event.data.object);
      await handleChargeSucceeded(chargeEvent, { paymentRepository });
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};
