import { paymentConfirmationDTO } from "@application/dto/payment/dto";
import type { PaymentConfirmationDTO } from "@application/dto/payment/types";
import { PAYMENT_SUCCEEDED } from "@domain/payment/events/types";
import { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import { LoggerService } from "@infrastructure/logging/service";
import { Effect } from "effect";

export const confirmation = (
	paymentIntentId: string,
): Effect.Effect<PaymentConfirmationDTO | null, never, StripeServerService | LoggerService> =>
	Effect.gen(function* () {
		const stripe = yield* StripeServerService;
		const logger = yield* LoggerService;

		return yield* stripe.paymentIntents.retrieve(paymentIntentId).pipe(
			Effect.map((raw) => paymentConfirmationDTO.create({ raw })),
			Effect.tap((confirmed) =>
				Effect.sync(() => {
					if (confirmed.status === PAYMENT_SUCCEEDED) return;

					logger.warn({
						message: "Payment intent not succeeded",
						context: {
							paymentIntentId: confirmed.id,
							status: confirmed.status,
							amount: confirmed.amount,
							currency: confirmed.currency,
						},
					});
				}),
			),
			Effect.catchAll((error) =>
				Effect.sync(() => {
					logger.logError({
						message: "Failed to retrieve payment intent",
						error,
						context: {
							paymentIntentId,
							service: "confirmation",
						},
					});
					return null;
				}),
			),
		);
	});
