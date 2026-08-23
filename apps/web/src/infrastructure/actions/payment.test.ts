import { type PaymentError, type PromoCodeError, RateLimitError, type ValidationError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreatePayment = vi.hoisted(() =>
	vi.fn<
		(
			params: unknown,
			ctx: unknown,
		) => Effect.Effect<
			{ clientSecret: string; discountInfo: null | { finalAmount: number } },
			ValidationError | PaymentError | PromoCodeError
		>
	>(),
);

const mockHeaders = vi.hoisted(() =>
	vi.fn().mockResolvedValue({
		get: vi.fn((key: string) => {
			if (key === "user-agent") return "test-agent";
			if (key === "x-forwarded-for") return "1.2.3.4";
			return null;
		}),
	}),
);

const mockCheckRateLimit = vi.hoisted(() => vi.fn<(ip: string) => Effect.Effect<void, RateLimitError>>());

vi.mock("@application/use-cases/payment", () => ({
	createPayment: mockCreatePayment,
}));

vi.mock("@infrastructure/services/payments/rateLimit", () => ({
	checkRateLimit: mockCheckRateLimit,
}));

vi.mock("@infrastructure/layers", () => ({
	ApplicationLayer: Layer.empty,
}));

vi.mock("next/headers", () => ({
	headers: mockHeaders,
}));

vi.mock("next/server", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/server")>();
	return { ...actual, after: vi.fn() };
});

const { createPaymentAction } = await import("./payment");

const validInput = { amount: 9.99, email: "user@example.com" };

describe("createPaymentAction", () => {
	beforeEach(() => {
		mockCreatePayment.mockClear();
		mockCheckRateLimit.mockClear();
		mockCheckRateLimit.mockReturnValue(Effect.void);
	});

	it("returns the operation's body", async () => {
		mockCreatePayment.mockReturnValue(Effect.succeed({ clientSecret: "client-secret-abc", discountInfo: null }));

		const result = await createPaymentAction(validInput);

		expect(result).toEqual({ success: true, clientSecret: "client-secret-abc" });
	});

	it("builds the RequestContext from the request headers", async () => {
		mockCreatePayment.mockReturnValue(Effect.succeed({ clientSecret: "pi_secret", discountInfo: null }));

		await createPaymentAction(validInput);

		expect(mockCreatePayment).toHaveBeenCalledWith({
			params: validInput,
			context: { userAgent: "test-agent", ipAddress: "1.2.3.4" },
		});
	});

	it("drops the status, which is the only thing it does differently from the route", async () => {
		mockCheckRateLimit.mockReturnValue(Effect.fail(new RateLimitError({ ip: "1.2.3.4" })));

		const result = await createPaymentAction(validInput);

		expect(result).not.toHaveProperty("status");
		expect(result.success).toBe(false);
	});
});
