import { paymentDataDTO } from "@application/dto/payment/dto";
import { createPaymentFailedEvent, createPaymentSucceededEvent } from "@domain/payment/events/factory/events";
import { handlePaymentFailed } from "@domain/payment/handlers/paymentFailed";
import { handlePaymentSucceeded } from "@domain/payment/handlers/paymentSucceeded";
import type { TursoService } from "@infrastructure/clients/db/turso/service";
import { LoggerService } from "@infrastructure/clients/logging/better-stack/service";
import type { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import type { DatabaseError } from "@infrastructure/errors";
import { savePayment } from "@infrastructure/services/payments/repository";
import { Effect } from "effect";
import type Stripe from "stripe";

export const processWebhookEvent = (
	event: Stripe.Event,
): Effect.Effect<void, DatabaseError, TursoService | StripeServerService | LoggerService> =>
	Effect.gen(function* () {
		const logger = yield* LoggerService;

		switch (event.type) {
			case "payment_intent.succeeded": {
				const paymentIntent = event.data.object;
				logger.info("Processing payment_intent.succeeded", {
					paymentIntentId: paymentIntent.id,
					status: paymentIntent.status,
					hasId: !!paymentIntent.id,
				});
				const paymentEvent = yield* createPaymentSucceededEvent(paymentIntent).pipe(
					Effect.tapError((e) =>
						Effect.sync(() => {
							logger.logError("Payment succeeded with no donor email, Premium can never be recovered", e, {
								paymentId: paymentIntent.id,
							});
						}),
					),
					Effect.catchTag("MissingDonorEmailError", () => Effect.succeed(undefined)),
				);

				if (!paymentEvent) break;

				const created = yield* savePayment(
					paymentDataDTO.create({
						raw: paymentIntent,
						params: {
							email: paymentEvent.email,
							promoCode: paymentEvent.promoCode,
							userAgent: paymentEvent.userAgent,
							ipAddress: paymentEvent.ipAddress,
						},
					}),
				);

				if (created) {
					logger.warn("Payment was missing from the DB and was created from the webhook", {
						paymentId: paymentEvent.paymentId,
					});
				}

				yield* handlePaymentSucceeded(paymentEvent).pipe(
					Effect.tapError((e) =>
						Effect.sync(() => {
							logger.logError("Error handling successful payment", e, { paymentId: paymentEvent.paymentId });
						}),
					),
				);
				break;
			}
			case "payment_intent.payment_failed": {
				const paymentEvent = createPaymentFailedEvent(event.data.object);
				yield* handlePaymentFailed(paymentEvent);
				break;
			}
			default:
				logger.warn("Unhandled webhook event type", { eventType: event.type, eventId: event.id });
				break;
		}
	});
