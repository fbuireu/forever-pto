import { MissingDonorEmailError } from "@infrastructure/errors";
import { Effect } from "effect";
import type Stripe from "stripe";
import type { PaymentFailedEvent, PaymentSucceededEvent } from "../types";
import { resolveChargeId } from "./resolvers";

const resolveDonorEmail = (paymentIntent: Stripe.PaymentIntent): string | undefined =>
	[paymentIntent.metadata.email, paymentIntent.receipt_email]
		.map((candidate) => candidate?.trim())
		.find((candidate) => !!candidate);

export const createPaymentSucceededEvent = (
	paymentIntent: Stripe.PaymentIntent,
): Effect.Effect<PaymentSucceededEvent, MissingDonorEmailError> => {
	const email = resolveDonorEmail(paymentIntent);

	if (!email) return Effect.fail(new MissingDonorEmailError({ paymentId: paymentIntent.id }));

	return Effect.succeed({
		type: "payment_succeeded" as const,
		paymentId: paymentIntent.id,
		email,
		amount: paymentIntent.amount,
		status: paymentIntent.status,
		latestChargeId: resolveChargeId(paymentIntent.latest_charge),
		promoCode: paymentIntent.metadata.promoCode ?? null,
		userAgent: paymentIntent.metadata.userAgent ?? null,
		ipAddress: paymentIntent.metadata.ipAddress ?? null,
	});
};

export const createPaymentFailedEvent = (paymentIntent: Stripe.PaymentIntent): PaymentFailedEvent => ({
	type: "payment_failed" as const,
	paymentId: paymentIntent.id,
	status: paymentIntent.status,
	errorMessage: paymentIntent.last_payment_error?.message ?? "Unknown error",
});
