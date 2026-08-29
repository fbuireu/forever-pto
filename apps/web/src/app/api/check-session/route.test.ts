import { ApiError } from "@infrastructure/api/errors";
import { INVALID_BODY } from "@infrastructure/api/parseJsonBody";
import { LoggerService } from "@infrastructure/clients/logging/better-stack/service";
import { SessionError, ValidationError } from "@infrastructure/errors";
import { SessionConfigurationError } from "@infrastructure/services/premium/sessionErrors";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockVerifySession = vi.hoisted(() =>
	vi.fn<(token: string) => Effect.Effect<{ email: string; paymentIntentId: string }, SessionError>>(),
);
const mockActivateWithEmail = vi.hoisted(() =>
	vi.fn<
		(
			email: string,
		) => Effect.Effect<{ email: string; premiumKey: string; token: string }, ValidationError | SessionError>
	>(),
);
const mockActivateWithClaimedPayment = vi.hoisted(() =>
	vi.fn<
		(
			email: string,
			key: string,
		) => Effect.Effect<{ email: string; premiumKey: string; token: string }, ValidationError | SessionError>
	>(),
);
const mockClearPremiumCookie = vi.hoisted(() => vi.fn());
const mockLogError = vi.hoisted(() => vi.fn());
const mockSetPremiumCookie = vi.hoisted(() => vi.fn());
const mockCookiesGet = vi.hoisted(() => vi.fn());

vi.mock("@infrastructure/services/premium/session", () => ({
	verifySession: mockVerifySession,
}));

vi.mock("@application/use-cases/activatePremium", () => ({
	activateWithEmail: mockActivateWithEmail,
	activateWithClaimedPayment: mockActivateWithClaimedPayment,
}));

vi.mock("@infrastructure/services/premium/cookie", () => ({
	clearPremiumCookie: mockClearPremiumCookie,
	setPremiumCookie: mockSetPremiumCookie,
	PREMIUM_COOKIE: "premium-token",
}));

vi.mock("next/headers", () => ({
	cookies: vi.fn().mockResolvedValue({ get: mockCookiesGet }),
}));

vi.mock("@infrastructure/layers", () => ({
	ApplicationLayer: Layer.succeed(LoggerService, {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		logError: mockLogError,
	}),
}));

vi.mock("next/server", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/server")>();
	return { ...actual, after: vi.fn() };
});

const { GET, POST } = await import("./route");

beforeEach(() => vi.clearAllMocks());

function makeRequest(body: unknown): Request {
	return new Request("http://localhost/api/check-session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

function makeRawRequest(body: string | null): Request {
	return new Request("http://localhost/api/check-session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body,
	});
}

describe("GET /api/check-session", () => {
	it("returns null fields when no cookie is present", async () => {
		mockCookiesGet.mockReturnValue(undefined);
		const response = await GET(new Request("http://localhost/api/check-session") as never);
		const body = await response.json();
		expect(body).toEqual({ premiumKey: null, email: null });
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it("returns session data when token is valid", async () => {
		mockCookiesGet.mockReturnValue({ value: "valid-token" });
		mockVerifySession.mockReturnValue(Effect.succeed({ email: "user@example.com", paymentIntentId: "pi_abc" }));
		const response = await GET(new Request("http://localhost/api/check-session") as never);
		const body = await response.json();
		expect(body).toEqual({ premiumKey: "pi_abc", email: "user@example.com" });
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it("clears cookie and returns null fields when session is invalid", async () => {
		mockCookiesGet.mockReturnValue({ value: "bad-token" });
		mockVerifySession.mockReturnValue(Effect.fail(new SessionError({ message: "invalid" })));
		const response = await GET(new Request("http://localhost/api/check-session") as never);
		const body = await response.json();
		expect(body).toEqual({ premiumKey: null, email: null });
		expect(mockClearPremiumCookie).toHaveBeenCalled();
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it("stays silent when the token itself did not verify", async () => {
		mockCookiesGet.mockReturnValue({ value: "bad-token" });
		mockVerifySession.mockReturnValue(Effect.fail(new SessionError({ message: "invalid" })));
		await GET(new Request("http://localhost/api/check-session") as never);
		expect(mockLogError).not.toHaveBeenCalled();
	});

	it("keeps the cookie and logs when the session could not be verified at all", async () => {
		mockCookiesGet.mockReturnValue({ value: "good-token" });
		mockVerifySession.mockReturnValue(
			Effect.fail(new SessionConfigurationError({ message: "JWT_SECRET environment variable is not set" })),
		);
		const response = await GET(new Request("http://localhost/api/check-session") as never);
		const body = await response.json();
		expect(body).toEqual({ premiumKey: null, email: null });
		expect(mockClearPremiumCookie).not.toHaveBeenCalled();
		expect(mockLogError).toHaveBeenCalledOnce();
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});
});

describe("POST /api/check-session", () => {
	it("returns 400 when email is missing", async () => {
		const response = await POST(makeRequest({ premiumKey: "pi_abc" }) as never);
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe(ApiError.EMAIL_REQUIRED);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it("activates with email only when no premiumKey provided", async () => {
		mockActivateWithEmail.mockReturnValue(
			Effect.succeed({ email: "user@example.com", premiumKey: "pi_abc", token: "tok" }),
		);
		const response = await POST(makeRequest({ email: "user@example.com" }) as never);
		const body = await response.json();
		expect(body.success).toBe(true);
		expect(body.email).toBe("user@example.com");
		expect(mockActivateWithEmail).toHaveBeenCalledWith("user@example.com");
		expect(mockSetPremiumCookie).toHaveBeenCalled();
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it("routes a body carrying a premiumKey to the claimed-payment entry point", async () => {
		mockActivateWithClaimedPayment.mockReturnValue(
			Effect.succeed({ email: "user@example.com", premiumKey: "pi_abc", token: "tok" }),
		);
		const response = await POST(makeRequest({ email: "user@example.com", premiumKey: "pi_abc" }) as never);
		const body = await response.json();
		expect(body.success).toBe(true);
		expect(mockActivateWithClaimedPayment).toHaveBeenCalledWith({
			paymentIntentId: "pi_abc",
			expectedEmail: "user@example.com",
		});
	});

	it("returns 400 on ValidationError", async () => {
		mockActivateWithEmail.mockReturnValue(Effect.fail(new ValidationError({ message: "No payment found" })));
		const response = await POST(makeRequest({ email: "user@example.com" }) as never);
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("No payment found");
	});

	it("returns 400 with the validation shape when the body is malformed", async () => {
		const response = await POST(makeRawRequest("{not json") as never);
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe(INVALID_BODY);
	});

	it("returns 400 with the validation shape when the body is empty", async () => {
		const response = await POST(makeRawRequest(null) as never);
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe(INVALID_BODY);
	});

	it("returns 500 on SessionError", async () => {
		mockActivateWithEmail.mockReturnValue(Effect.fail(new SessionError({ message: "jwt error" })));
		const response = await POST(makeRequest({ email: "user@example.com" }) as never);
		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toBe(ApiError.INTERNAL_ERROR);
	});
});
