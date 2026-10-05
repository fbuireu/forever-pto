import type { PaymentSucceededEvent } from "@domain/payment/events/types";
import { TursoService } from "@infrastructure/clients/db/turso/service";
import { StripeServerService } from "@infrastructure/clients/payments/stripe/serverService";
import { DatabaseError, PaymentError } from "@infrastructure/errors";
import { LoggerService } from "@infrastructure/logging/service";
import type * as Repository from "@infrastructure/services/payments/repository";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handlePaymentSucceeded } from "./paymentSucceeded";

vi.mock("@infrastructure/services/payments/repository", () => ({
	updatePaymentStatus: vi.fn<typeof Repository.updatePaymentStatus>(() => Effect.succeed(true)),
	updatePaymentCharge: vi.fn<typeof Repository.updatePaymentCharge>(() => Effect.succeed(undefined)),
}));

vi.mock("@infrastructure/services/payments/provider/charge", () => ({
	retrieveCharge: vi.fn(() =>
		Effect.succeed({
			id: "ch_test",
			receiptUrl: null,
			paymentMethodType: null,
			country: null,
			customerName: null,
			postalCode: null,
			city: null,
			state: null,
			paymentBrand: null,
			paymentLast4: null,
			feeAmount: null,
			netAmount: null,
		}),
	),
}));

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const mockTurso = { query: vi.fn(), execute: vi.fn(() => Effect.succeed(1)) };
const TestLayer = Layer.mergeAll(
	Layer.succeed(LoggerService, mockLogger),
	Layer.succeed(TursoService, mockTurso),
	Layer.succeed(StripeServerService, {
		paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
		charges: { retrieve: vi.fn() },
		promotionCodes: { list: vi.fn() },
		webhooks: { constructEvent: vi.fn() },
	}),
);

type R = LoggerService | TursoService | StripeServerService;
const run = <E>(eff: Effect.Effect<void, E, R>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));

const EVENT: PaymentSucceededEvent = {
	paymentId: "pi_test",
	email: "test@example.com",
	status: "succeeded",
	latestChargeId: "ch_test",
};

beforeEach(() => vi.clearAllMocks());

describe("handlePaymentSucceeded", () => {
	it("resolves without error", async () => {
		await expect(run(handlePaymentSucceeded(EVENT))).resolves.toBeUndefined();
	});

	it("never reads the row first, so an unreadable database cannot look like an absent payment", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		const repository = await vi.importActual<typeof Repository>("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockImplementationOnce(repository.updatePaymentStatus);

		await run(handlePaymentSucceeded(EVENT));

		expect(mockTurso.execute).toHaveBeenCalledOnce();
		expect(mockTurso.query).not.toHaveBeenCalled();
	});

	it("calls updatePaymentStatus exactly once, whatever the row holds, since the WHERE clause is the guard", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockReturnValueOnce(Effect.succeed(false));
		await run(handlePaymentSucceeded(EVENT));
		expect(updatePaymentStatus).toHaveBeenCalledExactlyOnceWith({ paymentIntentId: "pi_test", status: "succeeded" });
	});

	it("calls retrieveCharge and updatePaymentCharge when latestChargeId is present", async () => {
		const { retrieveCharge } = await import("@infrastructure/services/payments/provider/charge");
		const { updatePaymentCharge } = await import("@infrastructure/services/payments/repository");
		await run(handlePaymentSucceeded(EVENT));
		expect(retrieveCharge).toHaveBeenCalledWith("ch_test");
		expect(updatePaymentCharge).toHaveBeenCalledOnce();
	});

	it("does not call retrieveCharge when latestChargeId is null", async () => {
		const { retrieveCharge } = await import("@infrastructure/services/payments/provider/charge");
		await run(handlePaymentSucceeded({ ...EVENT, latestChargeId: null }));
		expect(retrieveCharge).not.toHaveBeenCalled();
	});

	it("warns and resolves when the write touched no row", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockReturnValueOnce(Effect.succeed(false));
		await expect(run(handlePaymentSucceeded(EVENT))).resolves.toBeUndefined();
		expect(mockLogger.warn).toHaveBeenCalledWith({
			message: "Succeeded-payment event wrote no status: the payment is absent or already succeeded",
			context: expect.objectContaining({ paymentId: "pi_test" }),
		});
	});

	it("does not warn when the write touched a row", async () => {
		await run(handlePaymentSucceeded(EVENT));
		expect(mockLogger.warn).not.toHaveBeenCalled();
	});

	it("still enriches the charge when the write touched no row, so a redelivery can repair it", async () => {
		const { updatePaymentStatus, updatePaymentCharge } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockReturnValueOnce(Effect.succeed(false));
		await run(handlePaymentSucceeded(EVENT));
		expect(updatePaymentCharge).toHaveBeenCalledOnce();
	});

	it("fails with the DatabaseError when the status write cannot be made, so the webhook answers 500", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "turso down" })));
		await expect(run(handlePaymentSucceeded(EVENT))).rejects.toThrow("turso down");
	});

	it("resolves even when retrieveCharge fails", async () => {
		const { retrieveCharge } = await import("@infrastructure/services/payments/provider/charge");
		vi.mocked(retrieveCharge).mockReturnValueOnce(Effect.fail(new PaymentError({ message: "stripe error" })));
		await expect(run(handlePaymentSucceeded(EVENT))).resolves.toBeUndefined();
	});

	it("resolves even when updatePaymentCharge fails", async () => {
		const { updatePaymentCharge } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentCharge).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db error" })));
		await expect(run(handlePaymentSucceeded(EVENT))).resolves.toBeUndefined();
	});

	it("logs a failing retrieveCharge once, as a retrieval failure", async () => {
		const { retrieveCharge } = await import("@infrastructure/services/payments/provider/charge");
		vi.mocked(retrieveCharge).mockReturnValueOnce(Effect.fail(new PaymentError({ message: "stripe error" })));
		await run(handlePaymentSucceeded(EVENT));
		expect(mockLogger.error).toHaveBeenCalledExactlyOnceWith({
			message: "Failed to retrieve charge details",
			context: expect.objectContaining({ reason: "stripe error", chargeId: "ch_test", paymentId: "pi_test" }),
		});
	});

	it("logs a failing updatePaymentCharge once, as an update failure", async () => {
		const { updatePaymentCharge } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentCharge).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db error" })));
		await run(handlePaymentSucceeded(EVENT));
		expect(mockLogger.error).toHaveBeenCalledExactlyOnceWith({
			message: "Failed to update charge details",
			context: expect.objectContaining({ reason: "db error", paymentId: "pi_test", chargeId: "ch_test" }),
		});
	});
});
