import type {
	DatabaseError,
	DuplicateContactError,
	EmailError,
	PaymentError,
	PromoCodeError,
	RateLimitError,
	SessionError,
	ValidationError,
} from "@infrastructure/errors";
import { isPaymentRequestError } from "@infrastructure/errors";

export const ApiError = {
	INTERNAL_ERROR: "internal_error",
	NOT_FOUND: "not_found",
	RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
	CONTACT_ALREADY_RECEIVED: "contact_already_received",
	EMAIL_REQUIRED: "email_required",
	INVALID_PAYMENT_REFERENCE: "invalid_payment_reference",
	MISSING_SIGNATURE: "missing_signature",
	INVALID_SIGNATURE: "invalid_signature",
	WEBHOOK_PROCESSING_FAILED: "webhook_processing_failed",
	WEBHOOK_MISCONFIGURED: "webhook_misconfigured",
} as const;

export type TaggedFailure =
	| RateLimitError
	| DuplicateContactError
	| ValidationError
	| PromoCodeError
	| PaymentError
	| EmailError
	| SessionError
	| DatabaseError;

export interface FailureDescriptor {
	status: 400 | 429 | 500;
	error: string;
}

type FailureByTag = { [FAILURE in TaggedFailure as FAILURE["_tag"]]: FAILURE };

const OPAQUE: FailureDescriptor = { status: 500, error: ApiError.INTERNAL_ERROR };

const FAILURE_RESPONSES: {
	[TAG in TaggedFailure["_tag"]]: (failure: FailureByTag[TAG]) => FailureDescriptor;
} = {
	RateLimitError: () => ({ status: 429, error: ApiError.RATE_LIMIT_EXCEEDED }),
	DuplicateContactError: () => ({ status: 429, error: ApiError.CONTACT_ALREADY_RECEIVED }),
	ValidationError: (failure) => ({ status: 400, error: failure.message }),
	PromoCodeError: (failure) => ({ status: 400, error: failure.code }),
	PaymentError: (failure) =>
		isPaymentRequestError(failure) ? { status: 400, error: ApiError.INVALID_PAYMENT_REFERENCE } : OPAQUE,
	EmailError: () => OPAQUE,
	SessionError: () => OPAQUE,
	DatabaseError: () => OPAQUE,
};

interface RespondToParams<TAG extends TaggedFailure["_tag"]> {
	tag: TAG;
	failure: FailureByTag[TAG];
}

const respondTo = <TAG extends TaggedFailure["_tag"]>({ tag, failure }: RespondToParams<TAG>): FailureDescriptor =>
	FAILURE_RESPONSES[tag](failure);

export const describeFailure = (failure: TaggedFailure): FailureDescriptor =>
	Object.hasOwn(FAILURE_RESPONSES, failure._tag) ? respondTo({ tag: failure._tag, failure }) : OPAQUE;
