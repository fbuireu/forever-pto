import {
	DatabaseError,
	EmailError,
	PaymentError,
	PaymentRequestError,
	PromoCodeError,
	RateLimitError,
	SessionError,
	ValidationError,
} from "@infrastructure/errors";
import { describe, expect, it } from "vitest";
import { ApiError, describeFailure } from "./errors";

describe("describeFailure", () => {
	it("returns the four opaque tags as 500 internal_error, so no internal message reaches the wire", () => {
		const opaque = [
			new PaymentError({ message: "No such payment_intent: 'pi_3ABC'" }),
			new EmailError({ message: "resend key rejected" }),
			new SessionError({ message: "jwt malformed" }),
			new DatabaseError({ message: "turso down" }),
		];

		for (const failure of opaque) {
			expect(describeFailure(failure)).toEqual({ status: 500, error: ApiError.INTERNAL_ERROR });
			expect(describeFailure(failure).error).not.toContain(failure.message);
		}
	});

	it("returns a PaymentRequestError as 400, because the provider refused the caller's reference, not the request", () => {
		expect(describeFailure(new PaymentRequestError({ message: "No such payment_intent: 'pi_invalid'" }))).toEqual({
			status: 400,
			error: ApiError.INVALID_PAYMENT_REFERENCE,
		});
	});

	it("keeps the provider's message off a PaymentRequestError response, same as the opaque tags", () => {
		const failure = new PaymentRequestError({ message: "No such payment_intent: 'pi_invalid'" });

		expect(describeFailure(failure).error).not.toContain(failure.message);
	});

	it("returns a ValidationError message verbatim, which is the one message that is safe to show", () => {
		expect(describeFailure(new ValidationError({ message: "invalid_body" }))).toEqual({
			status: 400,
			error: "invalid_body",
		});
	});

	it("returns a PromoCodeError by its code, never its message", () => {
		const failure = new PromoCodeError({ code: "invalid_or_expired", message: "internal detail" });
		expect(describeFailure(failure)).toEqual({ status: 400, error: "invalid_or_expired" });
	});

	it("returns a rate limit as 429", () => {
		expect(describeFailure(new RateLimitError({ ip: "1.2.3.4" }))).toEqual({
			status: 429,
			error: ApiError.RATE_LIMIT_EXCEEDED,
		});
	});

	it("falls back to 500 for a value whose tag is not in the table, so the safety net survives", () => {
		expect(describeFailure({ _tag: "SomethingElse" } as never)).toEqual({
			status: 500,
			error: ApiError.INTERNAL_ERROR,
		});
	});
});
