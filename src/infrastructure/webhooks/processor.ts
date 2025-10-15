import {
  createChargeSucceededEvent,
  createPaymentFailedEvent,
  createPaymentSucceededEvent,
} from '@domain/payment/events/factory/events';
import { handleChargeSucceeded } from '@domain/payment/handlers/charge-succeeded';
import { handlePaymentFailed } from '@domain/payment/handlers/payment-failed';
import { handlePaymentSucceeded } from '@domain/payment/handlers/payment-succeeded';
import { getTursoClientInstance } from '@infrastructure/clients/db/turso/client';
import { getStripeServerInstance } from '@infrastructure/clients/payments/stripe/client';
import { createChargeService } from '@infrastructure/services/payments/provider/charge-service';
import { createPaymentRepository } from '@infrastructure/services/payments/repository';
import type Stripe from 'stripe';

const turso = getTursoClientInstance();
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
      console.warn(`Unhandled event type: ${event.type}`);
  }
};
