import type StripeNode from "stripe";

const STRIPE_METADATA_MAX_LENGTH = 500;

export interface DonationMetadata {
	email: string | undefined;
	promoCode: string | null;
	userAgent: string | null;
	ipAddress: string | null;
}

export const clampMetadata = (value: string | null | undefined) => (value ?? "").slice(0, STRIPE_METADATA_MAX_LENGTH);

export const readDonationMetadata = (paymentIntent: StripeNode.PaymentIntent): DonationMetadata => ({
	email: [paymentIntent.metadata.email, paymentIntent.receipt_email]
		.map((candidate) => candidate?.trim())
		.find((candidate) => !!candidate),
	promoCode: paymentIntent.metadata.promoCode ?? null,
	userAgent: paymentIntent.metadata.userAgent ?? null,
	ipAddress: paymentIntent.metadata.ipAddress ?? null,
});
