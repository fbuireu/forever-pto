import type { DiscountInfo } from "@application/dto/payment/types";
import { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import type { PaymentError } from "@infrastructure/errors";
import { PAYMENT_CURRENCY } from "@infrastructure/services/payments/normalForms";
import { Effect } from "effect";
import type StripeNode from "stripe";
import { donationMetadata } from "./metadata";

interface CreatePaymentIntentParams {
	amount: number;
	email: string;
	promoCode?: string;
	discountInfo: DiscountInfo | null;
	userAgent?: string | null;
	ipAddress?: string | null;
}

export const createPaymentIntent = (
	params: CreatePaymentIntentParams,
): Effect.Effect<StripeNode.PaymentIntent, PaymentError, StripeServerService> =>
	Effect.gen(function* () {
		const stripe = yield* StripeServerService;
		const { amount, email, promoCode, discountInfo, userAgent, ipAddress } = params;

		return yield* stripe.paymentIntents.create({
			amount: Math.round(amount * 100),
			currency: PAYMENT_CURRENCY,
			description: discountInfo ? `Donation from ${email} (${promoCode} applied)` : `Donation from ${email}`,
			receipt_email: email,
			metadata: donationMetadata({ email, promoCode, userAgent, ipAddress, discountInfo }),
			automatic_payment_methods: { enabled: true },
		});
	});
