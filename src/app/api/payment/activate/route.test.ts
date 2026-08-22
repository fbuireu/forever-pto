import { EN, ES } from "@infrastructure/i18n/locales";
import { ACTIVATION_FAILED, ACTIVATION_PARAM } from "@infrastructure/services/premium/activation";
import { PREMIUM_COOKIE } from "@infrastructure/services/premium/cookie";
import { Effect, Layer } from "effect";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockActivateWithPayment, mockCheckRateLimit, mockAfter } = vi.hoisted(() => ({
	mockActivateWithPayment: vi.fn(),
	mockCheckRateLimit: vi.fn(),
	mockAfter: vi.fn(),
}));

vi.mock("@application/use-cases/activatePremium", () => ({ activateWithPayment: mockActivateWithPayment }));
vi.mock("@infrastructure/services/payments/rateLimit", () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock("@infrastructure/layers", () => ({ ApplicationLayer: Layer.empty }));

vi.mock("next/server", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/server")>();
	return { ...actual, after: mockAfter };
});

const { GET } = await import("./route");

const CLIENT_SECRET = "pi_test_123_secret_abc";
const PAYMENT_INTENT_ID = "pi_test_123";

const makeRequest = (query: Record<string, string>, headers: Record<string, string> = {}) => {
	const url = new URL("https://forever-pto.com/api/payment/activate");
	for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
	return new NextRequest(url, { headers });
};

const successfulQuery = {
	payment_intent: PAYMENT_INTENT_ID,
	payment_intent_client_secret: CLIENT_SECRET,
	redirect_status: "succeeded",
};

beforeEach(() => {
	vi.clearAllMocks();
	mockCheckRateLimit.mockReturnValue(Effect.void);
	mockActivateWithPayment.mockReturnValue(
		Effect.succeed({ email: "payer@example.com", premiumKey: PAYMENT_INTENT_ID, token: "jwt", deferred: Effect.void }),
	);
});

const locationOf = (response: Response) => new URL(response.headers.get("location") ?? "");

describe("GET /api/payment/activate", () => {
	it("sets the premium cookie before the confirmation page renders, which is the whole point of the redirect hop", async () => {
		const response = await GET(makeRequest(successfulQuery));

		expect(response.status).toBe(307);
		expect(response.cookies.get(PREMIUM_COOKIE)?.value).toBe("jwt");
		expect(locationOf(response).pathname).toBe("/payment/confirmation");
		expect(locationOf(response).searchParams.get(ACTIVATION_PARAM)).toBeNull();
	});

	it("passes the client secret through so activation can prove the caller completed the payment", async () => {
		await GET(makeRequest(successfulQuery));

		expect(mockActivateWithPayment).toHaveBeenCalledWith({
			paymentIntentId: PAYMENT_INTENT_ID,
			clientSecret: CLIENT_SECRET,
		});
	});

	it("refuses to activate without the client secret, so a leaked payment intent id is not enough", async () => {
		const response = await GET(makeRequest({ payment_intent: PAYMENT_INTENT_ID }));

		expect(mockActivateWithPayment).not.toHaveBeenCalled();
		expect(response.cookies.get(PREMIUM_COOKIE)).toBeUndefined();
		expect(locationOf(response).searchParams.get(ACTIVATION_PARAM)).toBe(ACTIVATION_FAILED);
	});

	it("does not call Stripe when Stripe itself reported the redirect failed", async () => {
		const response = await GET(makeRequest({ ...successfulQuery, redirect_status: "failed" }));

		expect(mockActivateWithPayment).not.toHaveBeenCalled();
		expect(locationOf(response).searchParams.get(ACTIVATION_PARAM)).toBe(ACTIVATION_FAILED);
	});

	it("rate-limits on the client ip before reaching the payment provider", async () => {
		await GET(makeRequest(successfulQuery, { "cf-connecting-ip": "203.0.113.7" }));

		expect(mockCheckRateLimit).toHaveBeenCalledWith("203.0.113.7");
	});

	it("grants nothing when the rate limiter rejects the request", async () => {
		mockCheckRateLimit.mockReturnValue(Effect.fail(new Error("rate limited")));

		const response = await GET(makeRequest(successfulQuery));

		expect(mockActivateWithPayment).not.toHaveBeenCalled();
		expect(response.cookies.get(PREMIUM_COOKIE)).toBeUndefined();
		expect(locationOf(response).searchParams.get(ACTIVATION_PARAM)).toBe(ACTIVATION_FAILED);
	});

	it("flags the failure instead of the cookie when activation fails", async () => {
		mockActivateWithPayment.mockReturnValue(Effect.fail(new Error("mismatch")));

		const response = await GET(makeRequest(successfulQuery));

		expect(response.cookies.get(PREMIUM_COOKIE)).toBeUndefined();
		expect(locationOf(response).searchParams.get(ACTIVATION_PARAM)).toBe(ACTIVATION_FAILED);
	});

	it("never lets a redirect carrying a Set-Cookie be cached", async () => {
		const response = await GET(makeRequest(successfulQuery));

		expect(response.headers.get("Cache-Control")).toContain("no-store");
	});

	it("keeps the payer on their own locale, prefixing only the non-default ones", async () => {
		const spanish = await GET(makeRequest({ ...successfulQuery, locale: ES }));
		const english = await GET(makeRequest({ ...successfulQuery, locale: EN }));

		expect(locationOf(spanish).pathname).toBe(`/${ES}/payment/confirmation`);
		expect(locationOf(english).pathname).toBe("/payment/confirmation");
	});

	it("falls back to the default locale rather than trusting the query for the redirect target", async () => {
		const response = await GET(makeRequest({ ...successfulQuery, locale: "https://evil.example.com" }));

		expect(locationOf(response).origin).toBe("https://forever-pto.com");
		expect(locationOf(response).pathname).toBe("/payment/confirmation");
	});

	it("defers the payment record write so the payer is redirected without waiting on the database", async () => {
		await GET(makeRequest(successfulQuery));

		expect(mockAfter).toHaveBeenCalled();
	});
});
