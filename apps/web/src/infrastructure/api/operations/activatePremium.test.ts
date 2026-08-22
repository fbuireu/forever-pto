import { ApiError } from "@infrastructure/api/errors";
import { LoggerService } from "@infrastructure/clients/logging/better-stack/service";
import { DatabaseError, PaymentError, RateLimitError, SessionError, ValidationError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const logger = vi.hoisted(() => ({
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	logError: vi.fn(),
}));

const mockAfter = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@infrastructure/layers", () => ({ ApplicationLayer: Layer.succeed(LoggerService, logger) }));
vi.mock("next/server", () => ({ after: mockAfter }));

vi.mock("@infrastructure/services/payments/rateLimit", () => ({ checkRateLimit: mockCheckRateLimit }));

const { activatePremiumRequest } = await import("./activatePremium");

const succeeds = Effect.succeed({
	email: "user@example.com",
	premiumKey: "pi_abc",
	token: "tok",
	deferred: Effect.void,
});

const IP = { ipAddress: "1.2.3.4" };

beforeEach(() => {
	vi.clearAllMocks();
	mockCheckRateLimit.mockReturnValue(Effect.void);
});

describe("activatePremiumRequest", () => {
	it("rate-limits before the use-case runs, so a limited caller never reaches Stripe", async () => {
		mockCheckRateLimit.mockReturnValue(Effect.fail(new RateLimitError({ ip: "1.2.3.4" })));
		const program = vi.fn(() => succeeds);

		const outcome = await activatePremiumRequest(IP, Effect.suspend(program) as never);

		expect(program).not.toHaveBeenCalled();
		expect(outcome.status).toBe(429);
		expect(outcome.token).toBeNull();
	});

	it("limits on the caller IP, and falls back to a fixed key rather than an empty one", async () => {
		await activatePremiumRequest(IP, succeeds as never);
		expect(mockCheckRateLimit).toHaveBeenCalledWith("1.2.3.4");

		await activatePremiumRequest({ ipAddress: null }, succeeds as never);
		expect(mockCheckRateLimit).toHaveBeenLastCalledWith("unknown");
	});

	it("answers 200 with the token and hands the deferred to after()", async () => {
		const outcome = await activatePremiumRequest(IP, succeeds as never);

		expect(outcome).toEqual({
			status: 200,
			token: "tok",
			email: "user@example.com",
			premiumKey: "pi_abc",
			error: null,
		});
		expect(mockAfter).toHaveBeenCalledOnce();
	});

	it.each([
		[new RateLimitError({ ip: "1.2.3.4" }), 429, ApiError.RATE_LIMIT_EXCEEDED, "warn"],
		[new ValidationError({ message: "Client secret mismatch" }), 400, "Client secret mismatch", "warn"],
		[new PaymentError({ message: "No such payment_intent: 'pi_3ABC'" }), 500, ApiError.INTERNAL_ERROR, "error"],
		[new SessionError({ message: "jwt malformed" }), 500, ApiError.INTERNAL_ERROR, "error"],
		[new DatabaseError({ message: "turso down" }), 500, ApiError.INTERNAL_ERROR, "error"],
	])("maps %s to its own status and logs it", async (failure, status, error, level) => {
		const outcome = await activatePremiumRequest(IP, Effect.fail(failure) as never);

		expect(outcome).toMatchObject({ status, error, token: null });
		expect(logger[level as "warn" | "error"]).toHaveBeenCalledOnce();
	});

	it("never leaks a Stripe message to the caller", async () => {
		const outcome = await activatePremiumRequest(
			IP,
			Effect.fail(new PaymentError({ message: "No such payment_intent: 'pi_3ABC'" })) as never,
		);

		expect(outcome.error).toBe(ApiError.INTERNAL_ERROR);
		expect(outcome.error).not.toContain("pi_3ABC");
	});

	it("does not schedule the deferred when activation refuses", async () => {
		await activatePremiumRequest(IP, Effect.fail(new ValidationError({ message: "Email mismatch" })) as never);
		expect(mockAfter).not.toHaveBeenCalled();
	});
});
