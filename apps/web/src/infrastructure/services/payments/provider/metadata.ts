import type { DiscountInfo } from "@application/dto/payment/types";
import type StripeNode from "stripe";

const STRIPE_METADATA_MAX_LENGTH = 500;

export interface DonationMetadata {
	email: string | undefined;
	promoCode: string | null;
	userAgent: string | null;
	ipAddress: string | null;
}

export interface DonationMetadataParams {
	email: string;
	promoCode?: string | null;
	userAgent?: string | null;
	ipAddress?: string | null;
	discountInfo: DiscountInfo | null;
}

export const clampMetadata = (value: string | null | undefined) => (value ?? "").slice(0, STRIPE_METADATA_MAX_LENGTH);

export const donationMetadata = ({
	email,
	promoCode,
	userAgent,
	ipAddress,
	discountInfo,
}: DonationMetadataParams): Record<string, string> => ({
	type: "donation",
	email,
	promoCode: clampMetadata(promoCode),
	userAgent: clampMetadata(userAgent),
	ipAddress: clampMetadata(ipAddress),
	...(discountInfo && {
		couponId: discountInfo.couponId,
		couponName: discountInfo.couponName ?? "",
		originalAmount: discountInfo.originalAmount.toFixed(2),
		discountType: discountInfo.type,
		discountValue: discountInfo.value.toString(),
		discountAmount: (discountInfo.originalAmount - discountInfo.finalAmount).toFixed(2),
	}),
	timestamp: new Date().toISOString(),
});

export const readDonationMetadata = (paymentIntent: StripeNode.PaymentIntent): DonationMetadata => ({
	email: [paymentIntent.metadata.email, paymentIntent.receipt_email]
		.map((candidate) => candidate?.trim())
		.find((candidate) => !!candidate),
	promoCode: paymentIntent.metadata.promoCode ?? null,
	userAgent: paymentIntent.metadata.userAgent ?? null,
	ipAddress: paymentIntent.metadata.ipAddress ?? null,
});
