import { paymentConfirmationDTO } from "@application/dto/payment/dto";
import type { PaymentConfirmationDTO } from "@application/dto/payment/types";
import { LoggerService } from "@infrastructure/clients/logging/better-stack/service";
import { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
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
					if (confirmed.status === "succeeded") return;

					logger.warn("Payment intent not succeeded", {
						paymentIntentId: confirmed.id,
						status: confirmed.status,
						amount: confirmed.amount,
						currency: confirmed.currency,
					});
				}),
			),
			Effect.catchAll((error) =>
				Effect.sync(() => {
					logger.logError("Failed to retrieve payment intent", error, {
						paymentIntentId,
						service: "confirmation",
					});
					return null;
				}),
			),
		);
	});
