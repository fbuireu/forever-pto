export const PAYMENT_STATUSES = [
	"canceled",
	"processing",
	"requires_action",
	"requires_capture",
	"requires_confirmation",
	"requires_payment_method",
	"succeeded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type ReportedPaymentStatus = PaymentStatus | (string & Record<never, never>);

export const PAYMENT_SUCCEEDED = "succeeded" satisfies PaymentStatus;

export interface PaymentSucceededEvent {
	paymentId: string;
	email: string;
	status: ReportedPaymentStatus;
	latestChargeId: string | null;
}

export interface PaymentFailedEvent {
	paymentId: string;
	status: ReportedPaymentStatus;
	errorMessage: string;
}
