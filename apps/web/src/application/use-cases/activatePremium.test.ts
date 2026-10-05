import { TursoService } from "@infrastructure/clients/db/turso/service";
import { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import { DatabaseError, PaymentError, ValidationError } from "@infrastructure/errors";
import { LoggerService } from "@infrastructure/logging/service";
import type * as Repository from "@infrastructure/services/payments/repository";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { activateWithClaimedPayment, activateWithEmail, activateWithPayment } from "./activatePremium";

vi.mock("@infrastructure/services/payments/repository", () => ({
	getSucceededPaymentByEmail: vi.fn<typeof Repository.getSucceededPaymentByEmail>(() => Effect.succeed(undefined)),
	savePayment: vi.fn<typeof Repository.savePayment>(() => Effect.succeed(true)),
	updatePaymentStatus: vi.fn<typeof Repository.updatePaymentStatus>(() => Effect.succeed(true)),
}));

vi.mock("@infrastructure/services/premium/session", () => ({
	createSession: vi.fn(() => Effect.succeed("jwt-token")),
}));

const CLIENT_SECRET = "fixture-client-secret";
const STRIPE_CREATED_SECONDS = 1_736_000_000;

const SUCCEEDED_INTENT = {
	id: "pi_test",
	status: "succeeded" as string,
	metadata: { email: "test@example.com" },
	receipt_email: null,
	client_secret: CLIENT_SECRET as string | null,
	created: STRIPE_CREATED_SECONDS,
	amount: 1000,
	currency: "eur",
	customer: null,
	latest_charge: null,
	payment_method_types: ["card"],
	description: "Donation from test@example.com",
};

const SAVED_PAYMENT = {
	id: "pi_test",
	stripeCreatedAt: new Date(STRIPE_CREATED_SECONDS * 1000),
	customerId: null,
	chargeId: null,
	email: "test@example.com",
	amount: 1000,
	currency: "eur",
	status: "succeeded",
	paymentMethodType: "card",
	description: "Donation from test@example.com",
	promoCode: null,
	userAgent: null,
	ipAddress: null,
};

const mockStripe = {
	paymentIntents: { retrieve: vi.fn(() => Effect.succeed(SUCCEEDED_INTENT) as never), create: vi.fn() },
	charges: { retrieve: vi.fn() },
	promotionCodes: { list: vi.fn() },
	webhooks: { constructEvent: vi.fn() },
};

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const TestLayer = Layer.mergeAll(
	Layer.succeed(LoggerService, mockLogger),
	Layer.succeed(TursoService, { query: vi.fn(), execute: vi.fn() }),
	Layer.succeed(StripeServerService, mockStripe),
);

type PremiumR = LoggerService | TursoService | StripeServerService;
const run = <A, E>(eff: Effect.Effect<A, E, PremiumR>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));
const runFail = <A, E>(eff: Effect.Effect<A, E, PremiumR>) =>
	Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(TestLayer)));
const runDeferred = (deferred: Effect.Effect<void, never, TursoService>) =>
	Effect.runPromise(deferred.pipe(Effect.provide(TestLayer)));

beforeEach(() => vi.clearAllMocks());

describe("the two donation entry points", () => {
	it("returns email, premiumKey and token on success", async () => {
		const result = await run(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" }),
		);
		expect(result).toMatchObject({ email: "test@example.com", premiumKey: "pi_test", token: "jwt-token" });
	});

	it("does not touch the payment record during the critical path", async () => {
		const { getSucceededPaymentByEmail, savePayment, updatePaymentStatus } = await import(
			"@infrastructure/services/payments/repository"
		);
		await run(activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" }));
		expect(getSucceededPaymentByEmail).not.toHaveBeenCalled();
		expect(savePayment).not.toHaveBeenCalled();
		expect(updatePaymentStatus).not.toHaveBeenCalled();
	});

	it("reconciles without reading first: insert-or-ignore, then the guarded update (deferred)", async () => {
		const { getSucceededPaymentByEmail, savePayment, updatePaymentStatus } = await import(
			"@infrastructure/services/payments/repository"
		);
		const { deferred } = await run(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" }),
		);
		await runDeferred(deferred);

		expect(getSucceededPaymentByEmail).not.toHaveBeenCalled();
		expect(savePayment).toHaveBeenCalledExactlyOnceWith(SAVED_PAYMENT);
		expect(updatePaymentStatus).toHaveBeenCalledWith({ paymentIntentId: "pi_test", status: "succeeded" });
	});

	it("saves the payment the intent describes, with the payer's address and the metadata the intent carried", async () => {
		const { savePayment } = await import("@infrastructure/services/payments/repository");
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.succeed({
				...SUCCEEDED_INTENT,
				metadata: { email: "Payer@Example.COM", promoCode: "SAVE20", userAgent: "Firefox", ipAddress: "1.2.3.4" },
			}) as never,
		);
		const { deferred } = await run(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: CLIENT_SECRET }));
		await runDeferred(deferred);

		expect(savePayment).toHaveBeenCalledExactlyOnceWith({
			...SAVED_PAYMENT,
			email: "payer@example.com",
			promoCode: "SAVE20",
			userAgent: "Firefox",
			ipAddress: "1.2.3.4",
		});
	});

	it("warns, never errors, when the status update fails, because the webhook repairs it (deferred)", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db down" })));
		const { deferred } = await run(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" }),
		);

		await expect(runDeferred(deferred)).resolves.toBeUndefined();

		expect(mockLogger.warn).toHaveBeenCalledExactlyOnceWith({
			message: "Failed to update payment status",
			context: { reason: "db down", paymentIntentId: "pi_test", emailDomain: "example.com" },
		});
		expect(mockLogger.error).not.toHaveBeenCalled();
	});

	it("warns, never errors, when the payment cannot be saved, because the webhook creates it (deferred)", async () => {
		const { savePayment, updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		vi.mocked(savePayment).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db down" })));
		const { deferred } = await run(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" }),
		);

		await expect(runDeferred(deferred)).resolves.toBeUndefined();

		expect(mockLogger.warn).toHaveBeenCalledExactlyOnceWith({
			message: "Failed to save payment to database, will use webhook fallback",
			context: { reason: "db down", paymentIntentId: "pi_test", emailDomain: "example.com" },
		});
		expect(updatePaymentStatus).toHaveBeenCalledOnce();
		expect(mockLogger.error).not.toHaveBeenCalled();
	});

	it("still marks the row succeeded when the insert was ignored, and says nothing about creating one (deferred)", async () => {
		const { savePayment, updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		vi.mocked(savePayment).mockReturnValueOnce(Effect.succeed(false));
		const { deferred } = await run(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" }),
		);
		await runDeferred(deferred);

		expect(updatePaymentStatus).toHaveBeenCalledWith({ paymentIntentId: "pi_test", status: "succeeded" });
		expect(mockLogger.info).not.toHaveBeenCalledWith(
			expect.objectContaining({ message: "Payment created successfully" }),
		);
	});

	it("reports a created row on the answer the insert itself gave (deferred)", async () => {
		const { savePayment } = await import("@infrastructure/services/payments/repository");
		vi.mocked(savePayment).mockReturnValueOnce(Effect.succeed(true));
		const { deferred } = await run(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" }),
		);
		await runDeferred(deferred);

		expect(savePayment).toHaveBeenCalledOnce();
		expect(mockLogger.info).toHaveBeenCalledWith({
			message: "Payment created successfully",
			context: { paymentIntentId: "pi_test" },
		});
	});

	it("lets a Stripe failure stay a PaymentError, so its message never reaches the payer", async () => {
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.fail(new PaymentError({ message: "No such payment_intent: 'pi_3ABC'" })) as never,
		);
		const err = await runFail(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: CLIENT_SECRET }));

		expect(err).toBeInstanceOf(PaymentError);
		expect(err).not.toBeInstanceOf(ValidationError);
	});

	it("fails with ValidationError when payment intent is not succeeded", async () => {
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.succeed({ ...SUCCEEDED_INTENT, status: "requires_payment_method" }) as never,
		);
		const err = await runFail(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" }),
		);
		expect(err).toBeInstanceOf(ValidationError);
		expect((err as ValidationError).message).toBe("Payment not completed");
	});

	it("fails with ValidationError on email mismatch", async () => {
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.succeed({ ...SUCCEEDED_INTENT, metadata: { email: "other@example.com" }, receipt_email: null }) as never,
		);
		const err = await runFail(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" }),
		);
		expect(err).toBeInstanceOf(ValidationError);
	});

	it("accepts the payer address retyped with different capitalisation, the only key Premium is recoverable by", async () => {
		const result = await run(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "  TEST@Example.com " }),
		);
		expect(result).toMatchObject({ email: "test@example.com" });
	});

	it("normalises the address Stripe recorded before it becomes the session key", async () => {
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.succeed({ ...SUCCEEDED_INTENT, metadata: { email: "Payer@Example.COM" } }) as never,
		);
		const result = await run(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: CLIENT_SECRET }));
		expect(result.email).toBe("payer@example.com");
	});

	it("falls through a blank metadata email to receipt_email, as the webhook does", async () => {
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.succeed({
				...SUCCEEDED_INTENT,
				metadata: { email: "   " },
				receipt_email: "payer@example.com",
			}) as never,
		);
		const result = await run(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: CLIENT_SECRET }));
		expect(result.email).toBe("payer@example.com");
	});

	it("derives the payer email from the payment intent, the only address the Stripe return carries", async () => {
		const result = await run(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: CLIENT_SECRET }));
		expect(result).toMatchObject({ email: "test@example.com", premiumKey: "pi_test" });
	});

	it("cannot be reached without a guard: activateWithPayment always runs the client-secret check", async () => {
		const err = await runFail(
			activateWithPayment({ paymentIntentId: "pi_test", clientSecret: "fixture-client-WRONGx" }),
		);

		expect(err).toBeInstanceOf(ValidationError);
		expect((err as ValidationError).message).toBe("Client secret mismatch");
	});

	it("refuses an empty client secret rather than skipping the check", async () => {
		const { createSession } = await import("@infrastructure/services/premium/session");
		const err = await runFail(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: "" }));

		expect(err).toBeInstanceOf(ValidationError);
		expect((err as ValidationError).message).toBe("Client secret mismatch");
		expect(createSession).not.toHaveBeenCalled();
	});

	it("cannot be reached without a guard: activateWithClaimedPayment always runs the email check", async () => {
		const err = await runFail(
			activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "attacker@example.com" }),
		);

		expect(err).toBeInstanceOf(ValidationError);
		expect((err as ValidationError).message).toBe("Email mismatch");
	});

	it("refuses an empty expected email rather than skipping the check", async () => {
		const { createSession } = await import("@infrastructure/services/premium/session");
		const err = await runFail(activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "" }));

		expect(err).toBeInstanceOf(ValidationError);
		expect((err as ValidationError).message).toBe("Email mismatch");
		expect(createSession).not.toHaveBeenCalled();
	});

	it("accepts the client secret Stripe appended to the return url", async () => {
		const result = await run(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: CLIENT_SECRET }));
		expect(result).toMatchObject({ premiumKey: "pi_test", token: "jwt-token" });
	});

	it("does not mint a session for a mismatched client secret", async () => {
		const { createSession } = await import("@infrastructure/services/premium/session");
		await runFail(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: "fixture-client-WRONGx" }));
		expect(createSession).not.toHaveBeenCalled();
	});

	it("rejects a client secret when the intent has none to compare against", async () => {
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.succeed({ ...SUCCEEDED_INTENT, client_secret: null }) as never,
		);
		const err = await runFail(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: CLIENT_SECRET }));
		expect(err).toBeInstanceOf(ValidationError);
	});

	it("fails with ValidationError when the payment intent carries no email", async () => {
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.succeed({ ...SUCCEEDED_INTENT, metadata: {}, receipt_email: null }) as never,
		);
		const err = await runFail(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: CLIENT_SECRET }));
		expect(err).toBeInstanceOf(ValidationError);
	});

	it("does not mint a session for a payment intent that carries no email", async () => {
		const { createSession } = await import("@infrastructure/services/premium/session");
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.succeed({ ...SUCCEEDED_INTENT, metadata: {}, receipt_email: null }) as never,
		);
		await runFail(activateWithPayment({ paymentIntentId: "pi_test", clientSecret: CLIENT_SECRET }));
		expect(createSession).not.toHaveBeenCalled();
	});

	it("accepts when receipt_email matches the provided email", async () => {
		mockStripe.paymentIntents.retrieve.mockReturnValueOnce(
			Effect.succeed({ ...SUCCEEDED_INTENT, metadata: {}, receipt_email: "test@example.com" }) as never,
		);
		await expect(
			run(activateWithClaimedPayment({ paymentIntentId: "pi_test", expectedEmail: "test@example.com" })),
		).resolves.toMatchObject({ email: "test@example.com", premiumKey: "pi_test" });
	});
});

describe("activateWithEmail", () => {
	it("returns email, premiumKey and token on success", async () => {
		const { getSucceededPaymentByEmail } = await import("@infrastructure/services/payments/repository");
		vi.mocked(getSucceededPaymentByEmail).mockReturnValueOnce(
			Effect.succeed({ id: "pi_found", status: "succeeded" } as never),
		);
		const result = await run(activateWithEmail("test@example.com"));
		expect(result).toMatchObject({ email: "test@example.com", premiumKey: "pi_found", token: "jwt-token" });
	});

	it("fails with ValidationError when no payment found", async () => {
		const err = await runFail(activateWithEmail("test@example.com"));
		expect(err).toBeInstanceOf(ValidationError);
	});

	it("asks for a succeeded payment rather than filtering one out afterwards", async () => {
		const { getSucceededPaymentByEmail } = await import("@infrastructure/services/payments/repository");
		await runFail(activateWithEmail("test@example.com"));
		expect(getSucceededPaymentByEmail).toHaveBeenCalledWith("test@example.com");
	});

	it("runs on a layer providing TursoService alone", async () => {
		const { getSucceededPaymentByEmail } = await import("@infrastructure/services/payments/repository");
		vi.mocked(getSucceededPaymentByEmail).mockReturnValueOnce(
			Effect.succeed({ id: "pi_found", status: "succeeded" } as never),
		);
		const TursoOnlyLayer = Layer.succeed(TursoService, { query: vi.fn(), execute: vi.fn() });
		const result = await Effect.runPromise(activateWithEmail("test@example.com").pipe(Effect.provide(TursoOnlyLayer)));
		expect(result).toMatchObject({ premiumKey: "pi_found", token: "jwt-token" });
	});

	it("calls createSession with the payment id", async () => {
		const { getSucceededPaymentByEmail } = await import("@infrastructure/services/payments/repository");
		const { createSession } = await import("@infrastructure/services/premium/session");
		vi.mocked(getSucceededPaymentByEmail).mockReturnValueOnce(
			Effect.succeed({ id: "pi_found", status: "succeeded" } as never),
		);
		await run(activateWithEmail("test@example.com"));
		expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ paymentIntentId: "pi_found" }));
	});
});
