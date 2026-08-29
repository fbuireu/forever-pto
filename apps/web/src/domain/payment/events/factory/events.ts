import { MissingDonorEmailError } from "@infrastructure/errors";
import { readDonationMetadata } from "@infrastructure/services/payments/provider/metadata";
import { Effect } from "effect";
import type Stripe from "stripe";
import type { PaymentFailedEvent, PaymentSucceededEvent } from "../types";
import { resolveChargeId } from "./resolvers";

export const createPaymentSucceededEvent = (
	paymentIntent: Stripe.PaymentIntent,
): Effect.Effect<PaymentSucceededEvent, MissingDonorEmailError> => {
	const { email } = readDonationMetadata(paymentIntent);

	if (!email) return Effect.fail(new MissingDonorEmailError({ paymentId: paymentIntent.id }));

	return Effect.succeed({
		paymentId: paymentIntent.id,
		email,
		status: paymentIntent.status,
		latestChargeId: resolveChargeId(paymentIntent.latest_charge),
	});
};

export const createPaymentFailedEvent = (paymentIntent: Stripe.PaymentIntent): PaymentFailedEvent => ({
	paymentId: paymentIntent.id,
	status: paymentIntent.status,
	errorMessage: paymentIntent.last_payment_error?.message ?? "Unknown error",
});
