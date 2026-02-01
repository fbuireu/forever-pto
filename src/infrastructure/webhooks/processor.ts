import {
  createChargeSucceededEvent,
  createPaymentFailedEvent,
  createPaymentSucceededEvent,
} from '@domain/payment/events/factory/events';
import { handleChargeSucceeded } from '@domain/payment/handlers/charge-succeeded';
import { handlePaymentFailed } from '@domain/payment/handlers/payment-failed';
import { handlePaymentSucceeded } from '@domain/payment/handlers/payment-succeeded';
import { getTursoClientInstance } from '@infrastructure/clients/db/turso/client';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { getStripeServerInstance } from '@infrastructure/clients/payments/stripe/client';
import { createChargeService } from '@infrastructure/services/payments/provider/charge-service';
import { createPaymentRepository } from '@infrastructure/services/payments/repository';
import type Stripe from 'stripe';

export const processWebhookEvent = async (event: Stripe.Event): Promise<void> => {
  const turso = getTursoClientInstance();
  const stripe = getStripeServerInstance();
  const logger = getBetterStackInstance();
  const paymentRepository = createPaymentRepository(turso);
  const chargeService = createChargeService(stripe);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      logger.info('Processing payment_intent.succeeded', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        hasId: !!paymentIntent.id,
      });
      const paymentEvent = createPaymentSucceededEvent(paymentIntent);
      await handlePaymentSucceeded(paymentEvent, { paymentRepository, chargeService, logger });
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentEvent = createPaymentFailedEvent(event.data.object);
      await handlePaymentFailed(paymentEvent, { paymentRepository, logger });
      break;
    }

    case 'charge.succeeded': {
      const chargeEvent = createChargeSucceededEvent(event.data.object);
      await handleChargeSucceeded(chargeEvent, { paymentRepository, logger });
      break;
    }

    default:
      logger.warn('Unhandled webhook event type', { eventType: event.type, eventId: event.id });
  }
};
