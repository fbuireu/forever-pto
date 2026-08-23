export type PaymentStatus =
	| "canceled"
	| "processing"
	| "requires_action"
	| "requires_capture"
	| "requires_confirmation"
	| "requires_payment_method"
	| "succeeded";

export const PAYMENT_SUCCEEDED: PaymentStatus = "succeeded";

export interface PaymentSucceededEvent {
	paymentId: string;
	email: string;
	status: PaymentStatus;
	latestChargeId: string | null;
}

export interface PaymentFailedEvent {
	paymentId: string;
	status: PaymentStatus;
	errorMessage: string;
}
