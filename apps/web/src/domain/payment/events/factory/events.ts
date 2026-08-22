import { MissingDonorEmailError } from "@infrastructure/errors";
import { readDonationMetadata } from "@infrastructure/services/payments/provider/metadata";
import { Effect } from "effect";
import type Stripe from "stripe";
import type { PaymentFailedEvent, PaymentSucceededEvent } from "../types";
import { resolveChargeId } from "./resolvers";

export const createPaymentSucceededEvent = (
	paymentIntent: Stripe.PaymentIntent,
): Effect.Effect<PaymentSucceededEvent, MissingDonorEmailError> => {
	const { email, promoCode, userAgent, ipAddress } = readDonationMetadata(paymentIntent);

	if (!email) return Effect.fail(new MissingDonorEmailError({ paymentId: paymentIntent.id }));

	return Effect.succeed({
		type: "payment_succeeded" as const,
		paymentId: paymentIntent.id,
		email,
		amount: paymentIntent.amount,
		status: paymentIntent.status,
		latestChargeId: resolveChargeId(paymentIntent.latest_charge),
		promoCode,
		userAgent,
		ipAddress,
	});
};

export const createPaymentFailedEvent = (paymentIntent: Stripe.PaymentIntent): PaymentFailedEvent => ({
	type: "payment_failed" as const,
	paymentId: paymentIntent.id,
	status: paymentIntent.status,
	errorMessage: paymentIntent.last_payment_error?.message ?? "Unknown error",
});
