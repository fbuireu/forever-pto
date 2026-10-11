import { MissingDonorEmailError } from "@infrastructure/errors";
import { Effect } from "effect";
import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { createPaymentFailedEvent, createPaymentSucceededEvent } from "./events";

const makeIntent = (overrides: Partial<Stripe.PaymentIntent> = {}): Stripe.PaymentIntent =>
	({
		id: "pi_test",
		status: "succeeded",
		amount: 999,
		metadata: { email: "user@example.com", promoCode: "SAVE20", userAgent: "Mozilla/5.0", ipAddress: "1.2.3.4" },
		receipt_email: null,
		latest_charge: null,
		last_payment_error: null,
		...overrides,
	}) as unknown as Stripe.PaymentIntent;

const succeeded = (intent: Stripe.PaymentIntent) => Effect.runSync(createPaymentSucceededEvent(intent));
const succeededError = (intent: Stripe.PaymentIntent) =>
	Effect.runSync(createPaymentSucceededEvent(intent).pipe(Effect.flip));

describe("createPaymentSucceededEvent", () => {
	it("maps paymentId from id", () => {
		expect(succeeded(makeIntent()).paymentId).toBe("pi_test");
	});

	it("maps email from metadata.email", () => {
		expect(succeeded(makeIntent()).email).toBe("user@example.com");
	});

	it("falls back to receipt_email when metadata.email is absent", () => {
		const intent = makeIntent({ metadata: {}, receipt_email: "fallback@example.com" });
		expect(succeeded(intent).email).toBe("fallback@example.com");
	});

	it("falls back to receipt_email when metadata.email is blank", () => {
		const intent = makeIntent({ metadata: { email: "   " }, receipt_email: "fallback@example.com" });
		expect(succeeded(intent).email).toBe("fallback@example.com");
	});

	it("trims the resolved email", () => {
		const intent = makeIntent({ metadata: { email: "  user@example.com  " } });
		expect(succeeded(intent).email).toBe("user@example.com");
	});

	it("fails when both email sources are absent", () => {
		const error = succeededError(makeIntent({ metadata: {}, receipt_email: null }));
		expect(error).toBeInstanceOf(MissingDonorEmailError);
		expect(error.paymentId).toBe("pi_test");
	});

	it("fails when both email sources are blank", () => {
		const error = succeededError(makeIntent({ metadata: { email: "" }, receipt_email: "   " }));
		expect(error).toBeInstanceOf(MissingDonorEmailError);
	});

	it("maps status", () => {
		expect(succeeded(makeIntent()).status).toBe("succeeded");
	});

	it("resolves latestChargeId from a string charge", () => {
		const intent = makeIntent({ latest_charge: "ch_string" });
		expect(succeeded(intent).latestChargeId).toBe("ch_string");
	});

	it("resolves latestChargeId from a charge object", () => {
		const intent = makeIntent({ latest_charge: { id: "ch_obj" } as Stripe.Charge });
		expect(succeeded(intent).latestChargeId).toBe("ch_obj");
	});

	it("returns null latestChargeId when latest_charge is absent", () => {
		expect(succeeded(makeIntent({ latest_charge: null })).latestChargeId).toBeNull();
	});

	it("carries only what a handler acts on, not a copy of the intent", () => {
		expect(Object.keys(succeeded(makeIntent())).toSorted()).toEqual(["email", "latestChargeId", "paymentId", "status"]);
	});
});

describe("createPaymentFailedEvent", () => {
	it("maps paymentId from id", () => {
		expect(createPaymentFailedEvent(makeIntent()).paymentId).toBe("pi_test");
	});

	it("maps status", () => {
		const intent = makeIntent({ status: "requires_payment_method" as Stripe.PaymentIntent.Status });
		expect(createPaymentFailedEvent(intent).status).toBe("requires_payment_method");
	});

	it("maps errorMessage from last_payment_error.message", () => {
		const intent = makeIntent({
			last_payment_error: { message: "Card declined" } as Stripe.PaymentIntent.LastPaymentError,
		});
		expect(createPaymentFailedEvent(intent).errorMessage).toBe("Card declined");
	});

	it('falls back to "Unknown error" when last_payment_error is null', () => {
		expect(createPaymentFailedEvent(makeIntent({ last_payment_error: null })).errorMessage).toBe("Unknown error");
	});

	it("carries only what a handler acts on, not a copy of the intent", () => {
		expect(Object.keys(createPaymentFailedEvent(makeIntent())).toSorted()).toEqual([
			"errorMessage",
			"paymentId",
			"status",
		]);
	});
});
