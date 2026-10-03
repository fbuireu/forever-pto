import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PromoCodeErrors } from "@application/dto/payment/types";
import { PaymentError, PromoCodeError } from "@infrastructure/errors";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreatePaymentAction = vi.hoisted(() => vi.fn());
const mockLogError = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());
const mockLoggerWarn = vi.hoisted(() => vi.fn());

vi.mock("@infrastructure/actions/payment", () => ({ createPaymentAction: mockCreatePaymentAction }));
vi.mock("@infrastructure/logging/logger", () => ({
	logger: { logError: mockLogError, error: mockLoggerError, warn: mockLoggerWarn },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterAll(() => {
	vi.unstubAllGlobals();
});

const { initializePayment, confirmPayment, ConfirmPaymentOutcome } = await import("./checkout");

const mockStripe = { confirmPayment: vi.fn() } as unknown as Stripe;
const mockElements = { submit: vi.fn() } as unknown as StripeElements;

const BASE_CONFIRM_PARAMS = {
	stripe: mockStripe,
	elements: mockElements,
	email: "user@example.com",
	returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/activate?locale=en`,
};

describe("logging imports", () => {
	const source = readFileSync(resolve(process.cwd(), "src/ui/adapters/payments/checkout.ts"), "utf8");

	it("reaches the BetterStack client through the shared client-log helper", () => {
		expect(source).toMatch(/from ["']@application\/shared\/utils\/clientLog["']/);
	});

	it("has no value-level static import of the BetterStack client", () => {
		expect(source).not.toMatch(/^import (?!type )[^\n]*better-stack\/client/m);
	});
});

describe("initializePayment", () => {
	beforeEach(() => {
		mockCreatePaymentAction.mockReset();
	});

	it("returns clientSecret and discountInfo on success", async () => {
		const discountInfo = {
			type: "percent" as const,
			value: 10,
			originalAmount: 100,
			finalAmount: 90,
			couponId: "c1",
			couponName: "SAVE10",
		};
		mockCreatePaymentAction.mockResolvedValue({ success: true, clientSecret: "client-secret-123", discountInfo });

		const result = await initializePayment({ amount: 100, email: "user@example.com" });

		expect(result.clientSecret).toBe("client-secret-123");
		expect(result.discountInfo).toEqual(discountInfo);
	});

	it("returns null discountInfo when not provided", async () => {
		mockCreatePaymentAction.mockResolvedValue({ success: true, clientSecret: "client-secret-123" });

		const result = await initializePayment({ amount: 100, email: "user@example.com" });

		expect(result.discountInfo).toBeNull();
	});

	it("throws PromoCodeError when isPromoCodeError is true", async () => {
		mockCreatePaymentAction.mockResolvedValue({
			success: false,
			isPromoCodeError: true,
			error: PromoCodeErrors.COUPON_EXPIRED,
		});

		await expect(
			initializePayment({ amount: 100, email: "user@example.com", promoCode: "BAD" }),
		).rejects.toBeInstanceOf(PromoCodeError);
	});

	it("carries the promo code error code", async () => {
		mockCreatePaymentAction.mockResolvedValue({
			success: false,
			isPromoCodeError: true,
			error: PromoCodeErrors.USAGE_LIMIT_REACHED,
		});

		const thrown = await initializePayment({ amount: 100, email: "user@example.com", promoCode: "MAXED" }).catch(
			(e) => e,
		);

		expect(thrown).toBeInstanceOf(PromoCodeError);
		expect(thrown.code).toBe(PromoCodeErrors.USAGE_LIMIT_REACHED);
	});

	it("does not turn a promo error code this build does not know into a PromoCodeError", async () => {
		mockCreatePaymentAction.mockResolvedValue({ success: false, isPromoCodeError: true, error: "not_a_promo_code" });

		const thrown = await initializePayment({ amount: 100, email: "user@example.com", promoCode: "ODD" }).catch(
			(e) => e,
		);

		expect(thrown).toBeInstanceOf(PaymentError);
		expect(thrown).not.toBeInstanceOf(PromoCodeError);
		expect(thrown.message).toBe("not_a_promo_code");
	});

	it("throws PaymentError on generic failure", async () => {
		mockCreatePaymentAction.mockResolvedValue({ success: false, error: "card declined" });

		await expect(initializePayment({ amount: 100, email: "user@example.com" })).rejects.toBeInstanceOf(PaymentError);
	});

	it("uses default message when error is undefined", async () => {
		mockCreatePaymentAction.mockResolvedValue({ success: false });

		const thrown = await initializePayment({ amount: 100, email: "user@example.com" }).catch((e) => e);

		expect(thrown).toBeInstanceOf(PaymentError);
		expect(thrown.message).toBe("Payment initialization failed");
	});
});

describe("confirmPayment", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns failure when elements.submit returns an error", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({ error: { message: "card incomplete" } });

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result).toEqual({ outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE, error: "card incomplete" });
	});

	it("returns failure when stripe.confirmPayment returns an error", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
		(mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
			error: { message: "declined by bank" },
		});

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result).toEqual({ outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE, error: "declined by bank" });
	});

	it("marks the failure as post-charge when the activation request itself throws", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
		(mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: "pi_123" } });
		mockFetch.mockRejectedValue(new Error("network down"));

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result.outcome).toBe(ConfirmPaymentOutcome.FAILED_AFTER_CHARGE);
	});

	it("marks the failure as post-charge when the activation response body cannot be read", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
		(mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: "pi_123" } });
		mockFetch.mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockRejectedValue(new Error("bad json")) });

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result.outcome).toBe(ConfirmPaymentOutcome.FAILED_AFTER_CHARGE);
	});

	it("returns failure and logs when session response is not ok", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
		(mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: "pi_123" } });
		mockFetch.mockResolvedValue({
			ok: false,
			status: 500,
			json: vi.fn().mockResolvedValue({ error: "session activation failed" }),
		});

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result).toEqual({ outcome: ConfirmPaymentOutcome.FAILED_AFTER_CHARGE, error: "session activation failed" });
		await vi.waitFor(() => expect(mockLoggerError).toHaveBeenCalled());
	});

	it.each([
		["a non-string reason", { error: 42 }],
		["a body that is not an object", null],
	])("reports no reason when the failed activation answers %s", async (_label, body) => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
		(mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: "pi_123" } });
		mockFetch.mockResolvedValue({ ok: false, status: 500, json: vi.fn().mockResolvedValue(body) });

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result).toEqual({ outcome: ConfirmPaymentOutcome.FAILED_AFTER_CHARGE, error: "" });
		await vi.waitFor(() =>
			expect(mockLoggerError).toHaveBeenCalledWith(
				expect.objectContaining({ context: expect.objectContaining({ statusCode: 500, reason: undefined }) }),
			),
		);
	});

	it.each([
		["no premium key", { success: true, email: "user@example.com" }],
		["a non-string premium key", { premiumKey: 42, email: "user@example.com" }],
		["an empty premium key", { premiumKey: "", email: "user@example.com" }],
		["no email", { premiumKey: "pk_abc" }],
		["a body that is not an object", null],
	])("never reports success after a charge when the activation answers with %s", async (_label, body) => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
		(mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: "pi_123" } });
		mockFetch.mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockResolvedValue(body) });

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result).toEqual({ outcome: ConfirmPaymentOutcome.FAILED_AFTER_CHARGE, error: "" });
		await vi.waitFor(() =>
			expect(mockLoggerError).toHaveBeenCalledWith(
				expect.objectContaining({ context: expect.objectContaining({ statusCode: 200, paymentIntentId: "pi_123" }) }),
			),
		);
	});

	it("returns success with sessionData on the happy path", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
		(mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({ paymentIntent: { id: "pi_123" } });
		mockFetch.mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ premiumKey: "pk_abc", email: "user@example.com" }),
		});

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result).toEqual({
			outcome: ConfirmPaymentOutcome.SUCCEEDED,
			sessionData: { premiumKey: "pk_abc", email: "user@example.com" },
		});
	});

	it("does not claim a charge on the redirect hand-off, and does not call check-session before the issuer answers", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
		(mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({});

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result).toEqual({ outcome: ConfirmPaymentOutcome.HANDED_OFF_TO_ISSUER });
		expect(mockFetch).not.toHaveBeenCalled();
		await vi.waitFor(() => expect(mockLoggerWarn).toHaveBeenCalled());
	});

	it("returns failure via catchAll when an unexpected error is thrown", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network timeout"));

		const result = await confirmPayment(BASE_CONFIRM_PARAMS);

		expect(result.outcome).toBe(ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE);
		await vi.waitFor(() => expect(mockLogError).toHaveBeenCalled());
	});
});

describe("confirmPayment's logs", () => {
	const writtenByTheLogger = async (context: Record<string, unknown>) => {
		const { logger } = await vi.importActual<typeof import("@infrastructure/logging/logger")>(
			"@infrastructure/logging/logger",
		);
		const sink = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		try {
			logger.warn({ message: "written", context });
			const [line] = sink.mock.calls[0] ?? [];
			return String(line);
		} finally {
			sink.mockRestore();
		}
	};

	it("puts the return URL under url, so the logger writes it without its query string", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockResolvedValue({});
		(mockStripe.confirmPayment as ReturnType<typeof vi.fn>).mockResolvedValue({});

		await confirmPayment(BASE_CONFIRM_PARAMS);
		await vi.waitFor(() => expect(mockLoggerWarn).toHaveBeenCalled());
		const [{ context }] = mockLoggerWarn.mock.lastCall ?? [];
		const line = await writtenByTheLogger(context);

		expect(JSON.parse(line).url).toBe(BASE_CONFIRM_PARAMS.returnUrl.split("?")[0]);
		expect(line).not.toContain("?");
	});

	it("puts the return URL under url on the unexpected-error path too", async () => {
		(mockElements.submit as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network timeout"));

		await confirmPayment(BASE_CONFIRM_PARAMS);
		await vi.waitFor(() => expect(mockLogError).toHaveBeenCalled());
		const [{ context }] = mockLogError.mock.lastCall ?? [];
		const line = await writtenByTheLogger(context);

		expect(JSON.parse(line).url).toBe(BASE_CONFIRM_PARAMS.returnUrl.split("?")[0]);
		expect(line).not.toContain("?");
	});
});
