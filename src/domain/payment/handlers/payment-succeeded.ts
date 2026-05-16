import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import type { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import type { DatabaseError } from '@infrastructure/errors';
import { retrieveCharge } from '@infrastructure/services/payments/provider/charge';
import { getPaymentById, updatePaymentCharge, updatePaymentStatus } from '@infrastructure/services/payments/repository';
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
        updatePaymentCharge({
          paymentIntentId: event.paymentId,
          chargeId: charge.id,
          receiptUrl: charge.receiptUrl,
          paymentMethodType: charge.paymentMethodType,
          country: charge.country,
          customerName: charge.customerName,
          postalCode: charge.postalCode,
          city: charge.city,
          state: charge.state,
          paymentBrand: charge.paymentBrand,
          paymentLast4: charge.paymentLast4,
          feeAmount: charge.feeAmount,
          netAmount: charge.netAmount,
        }).pipe(
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
