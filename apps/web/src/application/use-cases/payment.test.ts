import type { DiscountInfo } from "@application/dto/payment/types";
import { TursoService } from "@infrastructure/clients/db/turso/service";
import { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import { DatabaseError, PaymentError, ValidationError } from "@infrastructure/errors";
import { LoggerService } from "@infrastructure/logging/service";
import type * as PromoCode from "@infrastructure/services/payments/provider/promoCode";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPayment } from "./payment";

vi.mock("@application/shared/utils/zodParse", () => ({
	zodParse: vi.fn(({ data }) => Effect.succeed(data)),
}));

const STRIPE_CREATED_SECONDS = 1_736_000_000;

const PAYMENT_INTENT = vi.hoisted(() => ({
	id: "pi_test",
	client_secret: "cs_test_secret",
	created: 1_736_000_000,
	amount: 999,
	currency: "eur",
	status: "requires_payment_method",
	customer: null,
	latest_charge: null,
	payment_method_types: ["card"],
	description: "Donation from buyer@example.com",
}));

vi.mock("@infrastructure/services/payments/provider/intent", () => ({
	createPaymentIntent: vi.fn(() => Effect.succeed(PAYMENT_INTENT)),
}));

const SAVE20_DISCOUNT = vi.hoisted(
	(): DiscountInfo => ({
		type: "fixed",
		value: 200,
		originalAmount: 999,
		finalAmount: 799,
		couponId: "coupon_save20",
		couponName: "SAVE20",
	}),
);

vi.mock("@infrastructure/services/payments/provider/promoCode", () => ({
	validatePromoCode: vi.fn<typeof PromoCode.validatePromoCode>(() => Effect.succeed(SAVE20_DISCOUNT)),
}));

vi.mock("@infrastructure/services/payments/repository", () => ({
	savePayment: vi.fn(() => Effect.succeed(true)),
	getSucceededPaymentByEmail: vi.fn(() => Effect.succeed(undefined)),
	updatePaymentStatus: vi.fn(() => Effect.succeed(undefined)),
}));

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const TestLayer = Layer.mergeAll(
	Layer.succeed(LoggerService, mockLogger),
	Layer.succeed(TursoService, { query: vi.fn(), execute: vi.fn() }),
	Layer.succeed(StripeServerService, {
		paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
		charges: { retrieve: vi.fn() },
		promotionCodes: { list: vi.fn() },
		webhooks: { constructEvent: vi.fn() },
	}),
);

type PaymentR = LoggerService | TursoService | StripeServerService;
const run = <A, E>(eff: Effect.Effect<A, E, PaymentR>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));
const runFail = <A, E>(eff: Effect.Effect<A, E, PaymentR>) =>
	Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(TestLayer)));
const runDeferred = (deferred: Effect.Effect<void, never, TursoService>) =>
	Effect.runPromise(deferred.pipe(Effect.provide(TestLayer)));

const PARAMS = { amount: 999, email: "buyer@example.com", promoCode: undefined };
const CONTEXT = { userAgent: "test-agent", ipAddress: "127.0.0.1" };

beforeEach(() => vi.clearAllMocks());

describe("createPayment", () => {
	it("resolves with clientSecret on success", async () => {
		const result = await run(createPayment({ params: PARAMS, context: CONTEXT }));
		expect(result.clientSecret).toBe("cs_test_secret");
	});

	it("resolves with null discountInfo when no promo code", async () => {
		const result = await run(createPayment({ params: PARAMS, context: CONTEXT }));
		expect(result.discountInfo).toBeNull();
	});

	it("does not call validatePromoCode when promoCode is empty", async () => {
		const { validatePromoCode } = await import("@infrastructure/services/payments/provider/promoCode");
		await run(createPayment({ params: { ...PARAMS, promoCode: "" }, context: CONTEXT }));
		expect(validatePromoCode).not.toHaveBeenCalled();
	});

	it("applies promo code discount when promoCode is provided", async () => {
		const { validatePromoCode } = await import("@infrastructure/services/payments/provider/promoCode");
		const { createPaymentIntent } = await import("@infrastructure/services/payments/provider/intent");
		await run(createPayment({ params: { ...PARAMS, promoCode: "SAVE20" }, context: CONTEXT }));
		expect(validatePromoCode).toHaveBeenCalledWith({ code: "SAVE20", amount: 999 });
		expect(createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({ amount: 799 }));
	});

	it("returns discountInfo when promo code is applied", async () => {
		const result = await run(createPayment({ params: { ...PARAMS, promoCode: "SAVE20" }, context: CONTEXT }));
		expect(result.discountInfo).toEqual(SAVE20_DISCOUNT);
	});

	it("fails with ValidationError when zodParse fails", async () => {
		const { zodParse } = await import("@application/shared/utils/zodParse");
		vi.mocked(zodParse).mockReturnValueOnce(Effect.fail(new ValidationError({ message: "invalid input" })));
		const err = await runFail(createPayment({ params: PARAMS, context: CONTEXT }));
		expect(err).toBeInstanceOf(ValidationError);
	});

	it("fails with PaymentError when createPaymentIntent fails", async () => {
		const { createPaymentIntent } = await import("@infrastructure/services/payments/provider/intent");
		vi.mocked(createPaymentIntent).mockReturnValueOnce(Effect.fail(new PaymentError({ message: "Stripe error" })));
		const err = await runFail(createPayment({ params: PARAMS, context: CONTEXT }));
		expect(err).toBeInstanceOf(PaymentError);
	});

	it("fails with PaymentError when client_secret is missing", async () => {
		const { createPaymentIntent } = await import("@infrastructure/services/payments/provider/intent");
		vi.mocked(createPaymentIntent).mockReturnValueOnce(Effect.succeed({ id: "pi_test", client_secret: null } as never));
		const err = await runFail(createPayment({ params: PARAMS, context: CONTEXT }));
		expect(err).toBeInstanceOf(PaymentError);
	});

	it("does not persist the payment during the critical path", async () => {
		const { savePayment } = await import("@infrastructure/services/payments/repository");
		await run(createPayment({ params: PARAMS, context: CONTEXT }));
		expect(savePayment).not.toHaveBeenCalled();
	});

	it("persists the payment the intent describes when the deferred effect runs", async () => {
		const { savePayment } = await import("@infrastructure/services/payments/repository");
		const { deferred } = await run(createPayment({ params: PARAMS, context: CONTEXT }));
		await runDeferred(deferred);
		expect(savePayment).toHaveBeenCalledExactlyOnceWith({
			id: "pi_test",
			stripeCreatedAt: new Date(STRIPE_CREATED_SECONDS * 1000),
			customerId: null,
			chargeId: null,
			email: "buyer@example.com",
			amount: 999,
			currency: "eur",
			status: "requires_payment_method",
			paymentMethodType: "card",
			description: "Donation from buyer@example.com",
			promoCode: null,
			userAgent: "test-agent",
			ipAddress: "127.0.0.1",
		});
	});

	it("deferred effect recovers and warns when savePayment fails", async () => {
		const { savePayment } = await import("@infrastructure/services/payments/repository");
		vi.mocked(savePayment).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db error" })));
		const result = await run(createPayment({ params: PARAMS, context: CONTEXT }));
		expect(result.clientSecret).toBe("cs_test_secret");
		await expect(runDeferred(result.deferred)).resolves.toBeUndefined();
		expect(mockLogger.warn).toHaveBeenCalledOnce();
	});
});
