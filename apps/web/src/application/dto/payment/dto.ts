import type { BaseDTO } from "@application/shared/dto/baseDTO";
import { PAYMENT_SUCCEEDED, type PaymentStatus, type ReportedPaymentStatus } from "@domain/payment/events/types";
import type Stripe from "stripe";
import type { NewPayment, PaymentConfirmationDTO } from "./types";
import { extractChargeId, extractCustomerId } from "./utils/helpers";

const NOT_CHARGED_STATUSES: ReadonlySet<ReportedPaymentStatus> = new Set<PaymentStatus>([
	"requires_payment_method",
	"canceled",
]);

export const hasSucceeded = (confirmation: PaymentConfirmationDTO) => confirmation.status === PAYMENT_SUCCEEDED;

export const wasCharged = (confirmation: PaymentConfirmationDTO | null) =>
	!confirmation || !NOT_CHARGED_STATUSES.has(confirmation.status);

export const paymentConfirmationDTO: BaseDTO<Stripe.PaymentIntent, PaymentConfirmationDTO> = {
	create: ({ raw }) => ({
		id: raw.id,
		status: raw.status,
		amount: raw.amount / 100,
		currency: raw.currency.toUpperCase(),
	}),
};

interface PaymentDataDTOParams {
	email: string;
	promoCode: string | null;
	userAgent: string | null;
	ipAddress: string | null;
}

export const paymentDataDTO: BaseDTO<Stripe.PaymentIntent, NewPayment, PaymentDataDTOParams> = {
	create: ({ raw, params }) => {
		return {
			id: raw.id,
			stripeCreatedAt: new Date(raw.created * 1000),
			customerId: extractCustomerId(raw.customer),
			chargeId: extractChargeId(raw.latest_charge),
			email: params.email,
			amount: raw.amount,
			currency: raw.currency,
			status: raw.status,
			paymentMethodType: raw.payment_method_types?.[0] ?? null,
			description: raw.description ?? null,
			promoCode: params.promoCode,
			userAgent: params.userAgent,
			ipAddress: params.ipAddress,
		};
	},
};
