import type { PromoCodeErrorCode } from "@application/dto/payment/types";
import { Data } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
	message: string;
	cause?: unknown;
}> {}

export class EmailError extends Data.TaggedError("EmailError")<{
	message: string;
	cause?: unknown;
}> {}

export class MissingDonorEmailError extends Data.TaggedError("MissingDonorEmailError")<{
	paymentId: string;
}> {}

export class PaymentError extends Data.TaggedError("PaymentError")<{
	message: string;
	cause?: unknown;
}> {}

export class PaymentRequestError extends PaymentError {}

export const isPaymentRequestError = (error: PaymentError): error is PaymentRequestError =>
	error instanceof PaymentRequestError;

export class PromoCodeError extends Data.TaggedError("PromoCodeError")<{
	code: PromoCodeErrorCode;
	message?: string;
}> {}

export class DuplicateContactError extends Data.TaggedError("DuplicateContactError")<{
	reason: "cooldown" | "repeated";
}> {}

export class RateLimitError extends Data.TaggedError("RateLimitError")<{
	ip: string;
}> {}

export class WebhookError extends Data.TaggedError("WebhookError")<{
	message: string;
	isSignatureError: boolean;
	cause?: unknown;
}> {}

export class SessionError extends Data.TaggedError("SessionError")<{
	message: string;
	cause?: unknown;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
	message: string;
}> {}
