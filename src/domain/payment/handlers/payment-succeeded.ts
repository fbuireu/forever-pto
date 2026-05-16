import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import type { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import type { DatabaseError } from '@infrastructure/errors';
import { retrieveCharge } from '@infrastructure/services/payments/provider/charge';
import {
  getPaymentById,
  updatePaymentCharge,
  updatePaymentStatus,
} from '@infrastructure/services/payments/repository';
import { Effect } from 'effect';
import type { PaymentSucceededEvent } from '../events/types';

const updateCharge = (
  event: PaymentSucceededEvent
): Effect.Effect<void, never, TursoService | StripeServerService | LoggerService> => {
  const { latestChargeId } = event;
  if (!latestChargeId) return Effect.void;

  return Effect.gen(function* () {
    const logger = yield* LoggerService;

    yield* retrieveCharge(latestChargeId).pipe(
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
                chargeId: latestChargeId,
              });
            })
          )
        )
      ),
      Effect.tapError((e) =>
        Effect.sync(() => {
          logger.error('Failed to retrieve charge details', {
            reason: e.message,
            chargeId: latestChargeId,
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

    if (!existing) {
      logger.warn('Payment not found after creation attempt', { paymentId: event.paymentId });
      return;
    }

    if (existing.status !== 'succeeded') {
      yield* updatePaymentStatus(event.paymentId, event.status);
    }

    yield* updateCharge(event);
  });
