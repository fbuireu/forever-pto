import { createPaymentFailedEvent, createPaymentSucceededEvent } from '@domain/payment/events/factory/events';
import { handlePaymentFailed } from '@domain/payment/handlers/payment-failed';
import { handlePaymentSucceeded } from '@domain/payment/handlers/payment-succeeded';
import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import type { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import type { DatabaseError } from '@infrastructure/errors';
import { Effect } from 'effect';
import type Stripe from 'stripe';

export const processWebhookEvent = (
  event: Stripe.Event
): Effect.Effect<void, DatabaseError, TursoService | StripeServerService | LoggerService> =>
  Effect.gen(function* () {
    const logger = yield* LoggerService;

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        logger.info('Processing payment_intent.succeeded', {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          hasId: !!paymentIntent.id,
        });
        const paymentEvent = createPaymentSucceededEvent(paymentIntent);
        yield* handlePaymentSucceeded(paymentEvent).pipe(
          Effect.tapError((e) =>
            Effect.sync(() => {
              logger.logError('Error handling successful payment', e, { paymentId: paymentEvent.paymentId });
            })
          )
        );
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentEvent = createPaymentFailedEvent(event.data.object);
        yield* handlePaymentFailed(paymentEvent);
        break;
      }
      default:
        logger.warn('Unhandled webhook event type', { eventType: event.type, eventId: event.id });
        break;
    }
  });
