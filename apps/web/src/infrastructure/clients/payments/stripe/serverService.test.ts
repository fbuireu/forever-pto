import { PaymentError, PaymentRequestError, WebhookError } from "@infrastructure/errors";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
	StripeSignatureVerificationError,
	StripeInvalidRequestError,
	mockPaymentIntentsCreate,
	mockPaymentIntentsRetrieve,
	mockChargesRetrieve,
	mockPromotionCodesList,
	mockWebhooksConstructEvent,
	MockStripeNode,
} = vi.hoisted(() => {
	class StripeSignatureVerificationError extends Error {
		constructor(message: string) {
			super(message);
			this.name = "StripeSignatureVerificationError";
		}
	}
	class StripeInvalidRequestError extends Error {
		constructor(message: string) {
			super(message);
			this.name = "StripeInvalidRequestError";
		}
	}
	const mockPaymentIntentsCreate = vi.fn();
	const mockPaymentIntentsRetrieve = vi.fn();
	const mockChargesRetrieve = vi.fn();
	const mockPromotionCodesList = vi.fn();
	const mockWebhooksConstructEvent = vi.fn();
	class MockStripe {
		paymentIntents = { create: mockPaymentIntentsCreate, retrieve: mockPaymentIntentsRetrieve };
		charges = { retrieve: mockChargesRetrieve };
		promotionCodes = { list: mockPromotionCodesList };
		webhooks = { constructEvent: mockWebhooksConstructEvent };
	}
	const MockStripeNode = Object.assign(
		vi.fn().mockImplementation(MockStripe as unknown as () => InstanceType<typeof MockStripe>),
		{
			createFetchHttpClient: vi.fn().mockReturnValue({}),
			errors: { StripeSignatureVerificationError, StripeInvalidRequestError },
		},
	);
	return {
		StripeSignatureVerificationError,
		StripeInvalidRequestError,
		mockPaymentIntentsCreate,
		mockPaymentIntentsRetrieve,
		mockChargesRetrieve,
		mockPromotionCodesList,
		mockWebhooksConstructEvent,
		MockStripeNode,
	};
});

vi.mock("stripe", () => ({ default: MockStripeNode }));

const { isWebhookConfigurationError, StripeServerService, StripeServerServiceLive } = await import("./serverService");

beforeEach(() => {
	vi.clearAllMocks();
	process.env.STRIPE_SECRET_KEY = "sk_test_key";
	process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("StripeServerServiceLive initialisation", () => {
	it("builds the layer even when STRIPE_SECRET_KEY is missing", () => {
		vi.stubEnv("STRIPE_SECRET_KEY", "");
		expect(() => Effect.runSync(Effect.provide(StripeServerService, StripeServerServiceLive))).not.toThrow();
	});

	it("fails as PaymentError when STRIPE_SECRET_KEY is missing", async () => {
		vi.stubEnv("STRIPE_SECRET_KEY", "");
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.paymentIntents.create({ amount: 999, currency: "usd" }).pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(PaymentError);
		expect(error.message).toContain("STRIPE_SECRET_KEY");
		expect(MockStripeNode).not.toHaveBeenCalled();
	});
});

describe("StripeServerService.paymentIntents.retrieve", () => {
	it("returns the payment intent on success", async () => {
		const pi = { id: "pi_123", status: "succeeded" };
		mockPaymentIntentsRetrieve.mockResolvedValue(pi);
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.paymentIntents.retrieve("pi_123");
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(result).toEqual(pi);
	});

	it("wraps SDK errors as PaymentError", async () => {
		mockPaymentIntentsRetrieve.mockRejectedValue(new Error("network error"));
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.paymentIntents.retrieve("pi_bad").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(PaymentError);
	});

	it("wraps a rejected reference as PaymentRequestError, which the API maps to 400 rather than 500", async () => {
		mockPaymentIntentsRetrieve.mockRejectedValue(new StripeInvalidRequestError("No such payment_intent: 'pi_invalid'"));
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.paymentIntents.retrieve("pi_invalid").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(PaymentRequestError);
	});

	it("leaves a transport failure as a plain PaymentError, so an outage stays a 500", async () => {
		mockPaymentIntentsRetrieve.mockRejectedValue(new Error("network error"));
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.paymentIntents.retrieve("pi_bad").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).not.toBeInstanceOf(PaymentRequestError);
	});
});

describe("StripeServerService.paymentIntents.create", () => {
	it("returns the created payment intent on success", async () => {
		const pi = { id: "pi_new", status: "requires_payment_method" };
		mockPaymentIntentsCreate.mockResolvedValue(pi);
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.paymentIntents.create({ amount: 999, currency: "usd" });
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(result).toEqual(pi);
	});

	it("wraps SDK errors as PaymentError", async () => {
		mockPaymentIntentsCreate.mockRejectedValue(new Error("card declined"));
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.paymentIntents.create({ amount: 999, currency: "usd" }).pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(PaymentError);
	});

	it("wraps non-Error SDK rejections as PaymentError with stringified message", async () => {
		mockPaymentIntentsCreate.mockRejectedValue("string error");
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.paymentIntents.create({ amount: 999, currency: "usd" }).pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(PaymentError);
		expect(error.message).toBe("string error");
	});
});

describe("StripeServerService.charges.retrieve", () => {
	it("returns the charge on success", async () => {
		const charge = { id: "ch_123", amount: 999 };
		mockChargesRetrieve.mockResolvedValue(charge);
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.charges.retrieve("ch_123");
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(result).toEqual(charge);
		expect(mockChargesRetrieve).toHaveBeenCalledWith("ch_123", {});
	});

	it("forwards retrieve params to the SDK", async () => {
		mockChargesRetrieve.mockResolvedValue({ id: "ch_123" });
		await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.charges.retrieve("ch_123", { expand: ["balance_transaction"] });
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(mockChargesRetrieve).toHaveBeenCalledWith("ch_123", { expand: ["balance_transaction"] });
	});

	it("wraps SDK errors as PaymentError", async () => {
		mockChargesRetrieve.mockRejectedValue(new Error("charge not found"));
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.charges.retrieve("ch_bad").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(PaymentError);
		expect(error.message).toBe("charge not found");
	});
});

describe("StripeServerService.promotionCodes.list", () => {
	it("returns the list of promotion codes on success", async () => {
		const list = { data: [{ id: "promo_1", code: "SAVE10" }], has_more: false };
		mockPromotionCodesList.mockResolvedValue(list);
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.promotionCodes.list({ code: "SAVE10" });
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(result).toEqual(list);
	});

	it("wraps SDK errors as PaymentError", async () => {
		mockPromotionCodesList.mockRejectedValue(new Error("list failed"));
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.promotionCodes.list({}).pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(PaymentError);
	});
});

describe("StripeServerService.promotionCodes.list", () => {
	it("passes the coupon expansion through to the SDK", async () => {
		mockPromotionCodesList.mockResolvedValue({ data: [], has_more: false });
		await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.promotionCodes.list({ code: "SAVE10", expand: ["data.promotion.coupon"] });
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(mockPromotionCodesList).toHaveBeenCalledWith({ code: "SAVE10", expand: ["data.promotion.coupon"] });
	});
});

describe("StripeServerService.webhooks.constructEvent", () => {
	it("returns the event on valid signature", async () => {
		const event = { type: "payment_intent.succeeded", id: "evt_1" };
		mockWebhooksConstructEvent.mockReturnValue(event);
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.webhooks.constructEvent("payload", "sig");
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(result).toEqual(event);
	});

	it("wraps signature verification errors as WebhookError with isSignatureError=true", async () => {
		mockWebhooksConstructEvent.mockImplementation(() => {
			throw new StripeSignatureVerificationError("invalid signature");
		});
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.webhooks.constructEvent("payload", "bad-sig").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(WebhookError);
		expect(error.isSignatureError).toBe(true);
	});

	it("wraps non-signature errors as WebhookError with isSignatureError=false", async () => {
		mockWebhooksConstructEvent.mockImplementation(() => {
			throw new Error("generic error");
		});
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.webhooks.constructEvent("payload", "sig").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(WebhookError);
		expect(error.isSignatureError).toBe(false);
	});

	it("fails as WebhookError when STRIPE_WEBHOOK_SECRET is missing", async () => {
		vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.webhooks.constructEvent("payload", "sig").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(error).toBeInstanceOf(WebhookError);
		expect(error._tag).toBe("WebhookError");
	});

	it("marks a missing STRIPE_WEBHOOK_SECRET as a configuration failure, not a delivery one", async () => {
		vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.webhooks.constructEvent("payload", "sig").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(isWebhookConfigurationError(error)).toBe(true);
		expect(mockWebhooksConstructEvent).not.toHaveBeenCalled();
	});

	it("marks a missing STRIPE_SECRET_KEY as a configuration failure", async () => {
		vi.stubEnv("STRIPE_SECRET_KEY", "");
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.webhooks.constructEvent("payload", "sig").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(isWebhookConfigurationError(error)).toBe(true);
	});

	it("does not mark a genuine signature mismatch as a configuration failure", async () => {
		mockWebhooksConstructEvent.mockImplementation(() => {
			throw new StripeSignatureVerificationError("invalid signature");
		});
		const error = await Effect.runPromise(
			Effect.gen(function* () {
				const stripe = yield* StripeServerService;
				return yield* stripe.webhooks.constructEvent("payload", "bad-sig").pipe(Effect.flip);
			}).pipe(Effect.provide(StripeServerServiceLive)),
		);
		expect(isWebhookConfigurationError(error)).toBe(false);
	});
});
