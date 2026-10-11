import type { PaymentFailedEvent } from "@domain/payment/events/types";
import { TursoService } from "@infrastructure/clients/db/turso/service";
import { DatabaseError } from "@infrastructure/errors";
import { LoggerService } from "@infrastructure/logging/service";
import type * as Repository from "@infrastructure/services/payments/repository";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handlePaymentFailed } from "./paymentFailed";

vi.mock("@infrastructure/services/payments/repository", () => ({
	updatePaymentStatus: vi.fn<typeof Repository.updatePaymentStatus>(() => Effect.succeed(true)),
}));

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const mockTurso = { query: vi.fn(), execute: vi.fn(() => Effect.succeed(1)) };
const TestLayer = Layer.mergeAll(Layer.succeed(LoggerService, mockLogger), Layer.succeed(TursoService, mockTurso));

type R = LoggerService | TursoService;
const run = <E>(eff: Effect.Effect<void, E, R>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));
const runFail = <E>(eff: Effect.Effect<void, E, R>) =>
	Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(TestLayer)));

const EVENT: PaymentFailedEvent = {
	paymentId: "pi_test",
	status: "requires_payment_method",
	errorMessage: "Your card was declined.",
};

beforeEach(() => vi.clearAllMocks());

describe("handlePaymentFailed", () => {
	it("calls updatePaymentStatus with paymentId and status", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		await run(handlePaymentFailed(EVENT));
		expect(updatePaymentStatus).toHaveBeenCalledWith({ paymentIntentId: "pi_test", status: "requires_payment_method" });
	});

	it("resolves on success", async () => {
		await expect(run(handlePaymentFailed(EVENT))).resolves.toBeUndefined();
	});

	it("fails with DatabaseError when updatePaymentStatus fails", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db error" })));
		const err = await runFail(handlePaymentFailed(EVENT));
		expect(err).toBeInstanceOf(DatabaseError);
	});

	it("warns rather than retrying when the guarded update touched no row", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockReturnValueOnce(Effect.succeed(false));
		await run(handlePaymentFailed(EVENT));
		expect(mockLogger.warn).toHaveBeenCalledWith({
			message: "Ignoring failed-payment event for an already-succeeded or absent payment",
			context: { paymentId: "pi_test", reason: "Your card was declined." },
		});
	});

	it("stays silent when the guarded update reports it wrote the row", async () => {
		await run(handlePaymentFailed(EVENT));
		expect(mockLogger.warn).not.toHaveBeenCalled();
	});

	it("reads nothing before writing, so the succeeded row is protected by the WHERE clause", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		const repository = await vi.importActual<typeof Repository>("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockImplementationOnce(repository.updatePaymentStatus);

		await run(handlePaymentFailed(EVENT));

		expect(mockTurso.execute).toHaveBeenCalledOnce();
		expect(mockTurso.query).not.toHaveBeenCalled();
	});

	it("calls logError when updatePaymentStatus fails", async () => {
		const { updatePaymentStatus } = await import("@infrastructure/services/payments/repository");
		vi.mocked(updatePaymentStatus).mockReturnValueOnce(Effect.fail(new DatabaseError({ message: "db error" })));
		await runFail(handlePaymentFailed(EVENT));
		expect(mockLogger.logError).toHaveBeenCalledOnce();
	});
});
