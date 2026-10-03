import type { createPayment } from "@application/use-cases/payment";
import { INVALID_BODY } from "@infrastructure/api/parseJsonBody";
import { RateLimitError } from "@infrastructure/errors";
import type { checkRateLimit } from "@infrastructure/services/payments/rateLimit";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCheckRateLimit = vi.hoisted(() => vi.fn<typeof checkRateLimit>());
const mockAfter = vi.hoisted(() => vi.fn((work: () => unknown) => work()));

const mockCreatePayment = vi.hoisted(() => vi.fn<typeof createPayment>());

vi.mock("@infrastructure/services/payments/rateLimit", () => ({
	checkRateLimit: mockCheckRateLimit,
}));

vi.mock("@application/use-cases/payment", () => ({
	createPayment: mockCreatePayment,
}));

vi.mock("@infrastructure/layers", () => ({
	ApplicationLayer: Layer.empty,
}));

vi.mock("next/server", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/server")>();
	return { ...actual, after: mockAfter };
});

const { POST } = await import("./route");

interface MakeRequestParams {
	body: unknown;
	headers?: Record<string, string>;
}

function makeRequest({ body, headers }: MakeRequestParams): Request {
	return new Request("http://localhost/api/payment", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
}

describe("POST /api/payment", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("puts the operation's body and status on a NextResponse", async () => {
		mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
		mockCreatePayment.mockReturnValue(
			Effect.succeed({ clientSecret: "client-secret-abc", discountInfo: null, deferred: Effect.void }),
		);

		const response = await POST(makeRequest({ body: { amount: 9.99, email: "user@example.com" } }) as never);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, clientSecret: "client-secret-abc" });
	});

	it("builds the RequestContext from the request's own headers", async () => {
		mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));
		mockCreatePayment.mockReturnValue(
			Effect.succeed({ clientSecret: "pi_secret", discountInfo: null, deferred: Effect.void }),
		);

		await POST(makeRequest({ body: {}, headers: { "cf-connecting-ip": "1.2.3.4", "user-agent": "curl/8" } }) as never);

		expect(mockCreatePayment).toHaveBeenCalledWith({
			params: {},
			context: { userAgent: "curl/8", ipAddress: "1.2.3.4" },
		});
	});

	it("hands the operation parseJsonBody, so an unreadable body answers 400 rather than a bare 500", async () => {
		mockCheckRateLimit.mockReturnValue(Effect.succeed(undefined));

		const response = await POST(
			new Request("http://localhost/api/payment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{not json",
			}) as never,
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ success: false, error: INVALID_BODY });
		expect(mockCreatePayment).not.toHaveBeenCalled();
	});

	it("keeps every answer out of any cache, the one carrying the client secret first", async () => {
		mockCheckRateLimit.mockReturnValueOnce(Effect.succeed(undefined));
		mockCreatePayment.mockReturnValueOnce(
			Effect.succeed({ clientSecret: "client-secret-abc", discountInfo: null, deferred: Effect.void }),
		);
		mockCheckRateLimit.mockReturnValueOnce(Effect.fail(new RateLimitError({ ip: "1.2.3.4" })));

		const answers = [
			await POST(makeRequest({ body: { amount: 9.99, email: "user@example.com" } }) as never),
			await POST(makeRequest({ body: { amount: 9.99, email: "user@example.com" } }) as never),
		];

		expect(answers.map(({ status }) => status)).toEqual([200, 429]);
		expect(answers.map(({ headers }) => headers.get("Cache-Control"))).toEqual(["no-store", "no-store"]);
	});
});
