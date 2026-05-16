import { paymentDataDTO } from '@application/dto/payment/dto';
import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import type { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import type { DatabaseError } from '@infrastructure/errors';
import { retrieveCharge } from '@infrastructure/services/payments/provider/charge';
import {
  getPaymentById,
  savePayment,
  updatePaymentCharge,
  updatePaymentStatus,
} from '@infrastructure/services/payments/repository';
import { Effect } from 'effect';
import type { PaymentSucceededEvent } from '../events/types';

const updateCharge = (
  event: PaymentSucceededEvent
): Effect.Effect<void, never, TursoService | StripeServerService | LoggerService> => {
  if (!event.paymentIntent.latest_charge) return Effect.void;

  const chargeId =
    typeof event.paymentIntent.latest_charge === 'string'
      ? event.paymentIntent.latest_charge
      : event.paymentIntent.latest_charge.id;

  return Effect.gen(function* () {
    const logger = yield* LoggerService;

    yield* retrieveCharge(chargeId).pipe(
      Effect.flatMap((charge) =>
        updatePaymentCharge(
          event.paymentId,
          charge.id,
          charge.receiptUrl,
          charge.paymentMethodType,
          charge.country,
          charge.customerName,
          charge.postalCode,
          charge.city,
          charge.state,
          charge.paymentBrand,
          charge.paymentLast4,
          charge.feeAmount,
          charge.netAmount
        ).pipe(
          Effect.tapError((e) =>
            Effect.sync(() => {
              logger.error('Failed to update charge details', {
                reason: e.message,
                paymentId: event.paymentId,
                chargeId,
              });
            })
          )
        )
      ),
      Effect.tapError((e) =>
        Effect.sync(() => {
          logger.error('Failed to retrieve charge details', {
            reason: e.message,
            chargeId,
            paymentId: event.paymentId,
          });
        })
      ),
      Effect.catchAll(() => Effect.void)
    );
  });
};

export const handlePaymentSucceeded = (
  event: PaymentSucceededEvent
): Effect.Effect<void, DatabaseError, TursoService | StripeServerService | LoggerService> =>
  Effect.gen(function* () {
    const logger = yield* LoggerService;

    const existing = yield* getPaymentById(event.paymentId).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

    if (existing) {
      if (existing.status === 'succeeded') {
        yield* updateCharge(event);
        return;
      }
      yield* updatePaymentStatus(event.paymentId, event.status);
    } else {
      logger.warn('Payment not found in DB, creating from webhook', { paymentId: event.paymentId });
      yield* savePayment(
        paymentDataDTO.create({
          raw: event.paymentIntent,
          params: {
            email: event.email,
            promoCode: event.paymentIntent.metadata.promoCode ?? null,
            userAgent: event.paymentIntent.metadata.userAgent ?? null,
            ipAddress: event.paymentIntent.metadata.ipAddress ?? null,
          },
        })
      );
    }

    yield* updateCharge(event);
  });
