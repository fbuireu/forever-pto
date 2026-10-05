import { PAYMENT_SUCCEEDED, type PaymentStatus, type ReportedPaymentStatus } from "@domain/payment/events/types";
import type { PaymentConfirmationDTO } from "./types";

const NOT_CHARGED_STATUSES: ReadonlySet<ReportedPaymentStatus> = new Set<PaymentStatus>([
	"requires_payment_method",
	"canceled",
]);

export const hasSucceeded = (confirmation: PaymentConfirmationDTO) => confirmation.status === PAYMENT_SUCCEEDED;

export const wasCharged = (confirmation: PaymentConfirmationDTO | null) =>
	!confirmation || !NOT_CHARGED_STATUSES.has(confirmation.status);
