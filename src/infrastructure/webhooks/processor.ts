import type { TursoClient } from '@infrastructure/clients/db/turso/client';
import { handlePaymentSucceeded } from '@domain/payment/handlers/payment-succeeded';
import { handlePaymentFailed } from '@domain/payment/handlers/payment-failed';
import { handleChargeSucceeded } from '@domain/payment/handlers/charge-succeeded';
import {
  createPaymentSucceededEvent,
  createPaymentFailedEvent,
  createChargeSucceededEvent,
} from '@domain/payment/events/factories';
import type Stripe from 'stripe';

interface ProcessWebhookDeps {
  db: TursoClient;
  stripe: Stripe;
}

export const processWebhookEvent = async (event: Stripe.Event, deps: ProcessWebhookDeps): Promise<void> => {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentEvent = createPaymentSucceededEvent(event.data.object);
      await handlePaymentSucceeded(paymentEvent, deps);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentEvent = createPaymentFailedEvent(event.data.object);
      await handlePaymentFailed(paymentEvent, { db: deps.db });
      break;
    }

    case 'charge.succeeded': {
      const chargeEvent = createChargeSucceededEvent(event.data.object);
      await handleChargeSucceeded(chargeEvent, { db: deps.db });
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};
