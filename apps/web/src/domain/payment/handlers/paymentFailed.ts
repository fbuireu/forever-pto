import type { TursoService } from '@infrastructure/clients/db/turso/service';
import { LoggerService } from '@infrastructure/clients/logging/better-stack/service';
import type { DatabaseError } from '@infrastructure/errors';
import { updatePaymentStatus } from '@infrastructure/services/payments/repository';
import { Effect } from 'effect';
import type { PaymentFailedEvent } from '../events/types';

export const handlePaymentFailed = (
  event: PaymentFailedEvent
): Effect.Effect<void, DatabaseError, TursoService | LoggerService> =>
  Effect.gen(function* () {
    const logger = yield* LoggerService;

    const updated = yield* updatePaymentStatus(event.paymentId, event.status).pipe(
      Effect.tapError((e) =>
        Effect.sync(() => {
          logger.logError('Error handling failed payment', e, { paymentId: event.paymentId });
        })
      )
    );

    if (!updated) {
      logger.warn('Ignoring failed-payment event for an already-succeeded or absent payment', {
        paymentId: event.paymentId,
      });
    }
  });
