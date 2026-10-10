import type { ReportedPaymentStatus } from "@domain/payment/events/types";
import type Stripe from "stripe";

export interface PaymentConfirmationDTO {
	id: string;
	status: ReportedPaymentStatus;
	amount: number;
	currency: string;
}

export const PromoCodeErrors = {
	INVALID_OR_EXPIRED: "invalid_or_expired",
	USAGE_LIMIT_REACHED: "usage_limit_reached",
	COUPON_EXPIRED: "coupon_expired",
	COUPON_INVALID: "coupon_invalid",
	FAILED_TO_LOAD: "failed_to_load",
	MIN_AMOUNT_EXCEEDED: "min_amount_exceeded",
} as const;

export type PromoCodeErrorCode = (typeof PromoCodeErrors)[keyof typeof PromoCodeErrors];

export const ACTIVATION_PARAM = "activation";
export const ACTIVATION_FAILED = "failed";
export const ACTIVATION_COOKIE = "premium-activation";

export type DiscountInfo = {
	type: "percent" | "fixed";
	value: number;
	originalAmount: number;
	finalAmount: number;
	couponId: string;
	couponName: string | null;
};

type CreatePaymentSuccess = {
	success: true;
	clientSecret: string;
	discountInfo?: DiscountInfo;
};

type CreatePaymentError = {
	success: false;
	error?: string;
	isPromoCodeError?: boolean;
	stripeError?: Stripe.StripeRawError;
	code?: string;
	type?: string;
};

export type CreatePaymentResult = CreatePaymentSuccess | CreatePaymentError;

export interface NewPayment {
	id: string;
	stripeCreatedAt: Date;
	customerId: string | null;
	chargeId: string | null;
	email: string;
	amount: number;
	currency: string;
	status: string;
	paymentMethodType: string | null;
	description: string | null;
	promoCode: string | null;
	userAgent: string | null;
	ipAddress: string | null;
}

export interface PaymentData extends NewPayment {
	country: string | null;
	customerName: string | null;
	postalCode: string | null;
	city: string | null;
	state: string | null;
	paymentBrand: string | null;
	paymentLast4: string | null;
	feeAmount: number | null;
	netAmount: number | null;
	refundedAt: Date | null;
	refundReason: string | null;
	disputedAt: Date | null;
	disputeReason: string | null;
	parentPaymentId: string | null;
	origin: string | null;
}
