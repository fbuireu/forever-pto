import { TursoService } from "@infrastructure/clients/db/turso/service";
import { LoggerService } from "@infrastructure/clients/logging/better-stack/service";
import { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import { DatabaseError, MissingDonorEmailError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processWebhookEvent } from "./webhook";

vi.mock("@domain/payment/events/factory/events", () => ({
	createPaymentSucceededEvent: vi
		.fn()
		.mockReturnValue(Effect.succeed({ type: "payment_succeeded", paymentId: "pi_test" })),
	createPaymentFailedEvent: vi.fn().mockReturnValue({ type: "payment_failed", paymentId: "pi_test" }),
}));

vi.mock("@domain/payment/handlers/paymentSucceeded", () => ({
	handlePaymentSucceeded: vi.fn(() => Effect.succeed(undefined)),
}));

vi.mock("@domain/payment/handlers/paymentFailed", () => ({
	handlePaymentFailed: vi.fn(() => Effect.succeed(undefined)),
}));

vi.mock("@infrastructure/services/payments/repository", () => ({
	getPaymentById: vi.fn(() => Effect.succeed({ id: "pi_test", status: "pending" })),
	savePayment: vi.fn(() => Effect.succeed(undefined)),
}));

vi.mock("@application/dto/payment/dto", () => ({
	paymentDataDTO: { create: vi.fn().mockReturnValue({ id: "pi_test" }) },
}));

const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
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

type WebhookR = LoggerService | TursoService | StripeServerService;
const run = <E>(eff: Effect.Effect<void, E, WebhookR>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));

const succeededEvent = (object: Partial<Stripe.PaymentIntent>) =>
	({
		type: "payment_intent.succeeded",
		data: { object },
		id: "evt_test",
		object: "event",
	}) as Stripe.PaymentIntentSucceededEvent;

const failedEvent = (object: Partial<Stripe.PaymentIntent>) =>
	({
		type: "payment_intent.payment_failed",
		data: { object },
		id: "evt_test",
		object: "event",
	}) as Stripe.PaymentIntentPaymentFailedEvent;

const unhandledEvent = () =>
	({
		type: "customer.created",
		data: { object: {} },
		id: "evt_test",
		object: "event",
	}) as Stripe.CustomerCreatedEvent;

beforeEach(() => vi.clearAllMocks());

describe("processWebhookEvent", () => {
	it("calls handlePaymentSucceeded for payment_intent.succeeded", async () => {
		const { handlePaymentSucceeded } = await import("@domain/payment/handlers/paymentSucceeded");
		await run(processWebhookEvent(succeededEvent({ id: "pi_test" })));
		expect(handlePaymentSucceeded).toHaveBeenCalledOnce();
	});

	it("calls createPaymentSucceededEvent with the payment intent object", async () => {
		const { createPaymentSucceededEvent } = await import("@domain/payment/events/factory/events");
		const intent = { id: "pi_test", status: "succeeded" as const };
		await run(processWebhookEvent(succeededEvent(intent)));
		expect(createPaymentSucceededEvent).toHaveBeenCalledWith(intent);
	});

	it("leaves an existing row alone, and says nothing about creating one", async () => {
		const { savePayment, getPaymentById } = await import("@infrastructure/services/payments/repository");
		vi.mocked(savePayment).mockReturnValueOnce(Effect.succeed(false) as never);

		await run(processWebhookEvent(succeededEvent({ id: "pi_test" })));

		expect(getPaymentById).not.toHaveBeenCalled();
		expect(savePayment).toHaveBeenCalledOnce();
		expect(mockLogger.warn).not.toHaveBeenCalledWith(
			"Payment was missing from the DB and was created from the webhook",
			expect.anything(),
		);
	});

	it("reports a created row on the answer the insert itself gave", async () => {
		const { savePayment } = await import("@infrastructure/services/payments/repository");
		vi.mocked(savePayment).mockReturnValueOnce(Effect.succeed(true) as never);
		await run(processWebhookEvent(succeededEvent({ id: "pi_test" })));
		expect(savePayment).toHaveBeenCalledOnce();
		expect(mockLogger.warn).toHaveBeenCalledWith(
			"Payment was missing from the DB and was created from the webhook",
			expect.objectContaining({ paymentId: "pi_test" }),
		);
	});

	it("propagates a handlePaymentSucceeded failure so Stripe retries the delivery", async () => {
		const { handlePaymentSucceeded } = await import("@domain/payment/handlers/paymentSucceeded");
		vi.mocked(handlePaymentSucceeded).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db down" })));
		await expect(run(processWebhookEvent(succeededEvent({ id: "pi_test" })))).rejects.toBeDefined();
	});

	it("logs the error when handlePaymentSucceeded fails", async () => {
		const { handlePaymentSucceeded } = await import("@domain/payment/handlers/paymentSucceeded");
		vi.mocked(handlePaymentSucceeded).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db down" })));
		await run(processWebhookEvent(succeededEvent({ id: "pi_test" }))).catch(() => undefined);
		expect(mockLogger.logError).toHaveBeenCalledWith(
			"Error handling successful payment",
			expect.anything(),
			expect.objectContaining({ paymentId: "pi_test" }),
		);
	});

	it("succeeds so Stripe stops redelivering when the intent carries no donor email", async () => {
		const { createPaymentSucceededEvent } = await import("@domain/payment/events/factory/events");
		vi.mocked(createPaymentSucceededEvent).mockReturnValueOnce(
			Effect.fail(new MissingDonorEmailError({ paymentId: "pi_test" })),
		);
		await expect(run(processWebhookEvent(succeededEvent({ id: "pi_test" })))).resolves.toBeUndefined();
	});

	it("logs an error and touches nothing when the intent carries no donor email", async () => {
		const { createPaymentSucceededEvent } = await import("@domain/payment/events/factory/events");
		const { handlePaymentSucceeded } = await import("@domain/payment/handlers/paymentSucceeded");
		const { savePayment } = await import("@infrastructure/services/payments/repository");
		vi.mocked(createPaymentSucceededEvent).mockReturnValueOnce(
			Effect.fail(new MissingDonorEmailError({ paymentId: "pi_test" })),
		);
		await run(processWebhookEvent(succeededEvent({ id: "pi_test" })));
		expect(mockLogger.logError).toHaveBeenCalledWith(
			"Payment succeeded with no donor email, Premium can never be recovered",
			expect.any(MissingDonorEmailError),
			expect.objectContaining({ paymentId: "pi_test" }),
		);
		expect(handlePaymentSucceeded).not.toHaveBeenCalled();
		expect(savePayment).not.toHaveBeenCalled();
	});

	it("propagates a handlePaymentFailed failure so Stripe retries the delivery", async () => {
		const { handlePaymentFailed } = await import("@domain/payment/handlers/paymentFailed");
		vi.mocked(handlePaymentFailed).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db down" })));
		await expect(run(processWebhookEvent(failedEvent({ id: "pi_test" })))).rejects.toBeDefined();
	});

	it("calls handlePaymentFailed for payment_intent.payment_failed", async () => {
		const { handlePaymentFailed } = await import("@domain/payment/handlers/paymentFailed");
		await run(processWebhookEvent(failedEvent({ id: "pi_test" })));
		expect(handlePaymentFailed).toHaveBeenCalledOnce();
	});

	it("calls createPaymentFailedEvent with the payment intent object", async () => {
		const { createPaymentFailedEvent } = await import("@domain/payment/events/factory/events");
		const intent = { id: "pi_test" };
		await run(processWebhookEvent(failedEvent(intent)));
		expect(createPaymentFailedEvent).toHaveBeenCalledWith(intent);
	});

	it("logs a warning for unhandled event types", async () => {
		await run(processWebhookEvent(unhandledEvent()));
		expect(mockLogger.warn).toHaveBeenCalledWith(
			"Unhandled webhook event type",
			expect.objectContaining({ eventType: "customer.created" }),
		);
	});

	it("does not call any handler for unhandled event types", async () => {
		const { handlePaymentSucceeded } = await import("@domain/payment/handlers/paymentSucceeded");
		const { handlePaymentFailed } = await import("@domain/payment/handlers/paymentFailed");
		await run(processWebhookEvent(unhandledEvent()));
		expect(handlePaymentSucceeded).not.toHaveBeenCalled();
		expect(handlePaymentFailed).not.toHaveBeenCalled();
	});
});
