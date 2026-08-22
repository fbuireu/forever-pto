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

	it("maps amount and status", () => {
		const event = succeeded(makeIntent());
		expect(event.amount).toBe(999);
		expect(event.status).toBe("succeeded");
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

	it("extracts promoCode, userAgent, ipAddress from metadata", () => {
		const event = succeeded(makeIntent());
		expect(event.promoCode).toBe("SAVE20");
		expect(event.userAgent).toBe("Mozilla/5.0");
		expect(event.ipAddress).toBe("1.2.3.4");
	});

	it("returns null for absent metadata fields", () => {
		const intent = makeIntent({ metadata: {}, receipt_email: "fallback@example.com" });
		const event = succeeded(intent);
		expect(event.promoCode).toBeNull();
		expect(event.userAgent).toBeNull();
		expect(event.ipAddress).toBeNull();
	});

	it("sets type discriminant", () => {
		expect(succeeded(makeIntent()).type).toBe("payment_succeeded");
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

	it("sets type discriminant", () => {
		expect(createPaymentFailedEvent(makeIntent()).type).toBe("payment_failed");
	});
});
