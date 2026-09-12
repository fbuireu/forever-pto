import type { TursoService } from "@infrastructure/clients/db/turso/service";
import type { DatabaseError } from "@infrastructure/errors";
import { LoggerService } from "@infrastructure/logging/service";
import { updatePaymentStatus } from "@infrastructure/services/payments/repository";
import { Effect } from "effect";
import type { PaymentFailedEvent } from "../events/types";

export const handlePaymentFailed = (
	event: PaymentFailedEvent,
): Effect.Effect<void, DatabaseError, TursoService | LoggerService> =>
	Effect.gen(function* () {
		const logger = yield* LoggerService;

		const updated = yield* updatePaymentStatus({ paymentIntentId: event.paymentId, status: event.status }).pipe(
			Effect.tapError((e) =>
				Effect.sync(() => {
					logger.logError({
						message: "Error handling failed payment",
						error: e,
						context: { paymentId: event.paymentId },
					});
				}),
			),
		);

		if (!updated) {
			logger.warn({
				message: "Ignoring failed-payment event for an already-succeeded or absent payment",
				context: {
					paymentId: event.paymentId,
					reason: event.errorMessage,
				},
			});
		}
	});
