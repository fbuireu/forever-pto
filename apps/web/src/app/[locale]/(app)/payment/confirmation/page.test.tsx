import { ACTIVATION_FAILED, ACTIVATION_FRESH, type PaymentConfirmationDTO } from "@application/dto/payment/types";
import { DE, EN, ES } from "@infrastructure/i18n/locales";
import { render } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { createFormatter, type Locale } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const NON_BREAKING_SPACES = /[  ]/g;

const PAYMENT_INTENT_ID = "pi_test_123";

const mockRedirect = vi.fn();
const mockGetTranslations = vi.fn();
const mockGetFormatter = vi.fn();
const mockConfirmation = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

vi.mock("@infrastructure/layers", () => ({ ApplicationLayer: Layer.empty }));

vi.mock("@infrastructure/services/payments/confirmation", () => ({
	confirmation: mockConfirmation,
}));

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getFormatter: mockGetFormatter,
}));

vi.mock("@application/i18n/navigation", () => ({
	Link: vi.fn().mockReturnValue(null),
}));

vi.mock("@ui/modules/core/primitives/Button", () => ({
	Button: vi.fn().mockReturnValue(null),
}));

vi.mock("@ui/modules/core/primitives/Card", () => {
	const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
	return {
		Card: passthrough,
		CardContent: passthrough,
		CardDescription: passthrough,
		CardHeader: passthrough,
		CardTitle: passthrough,
	};
});

vi.mock("@ui/modules/premium/PremiumSessionSync", () => ({
	PremiumSessionSync: () => <span data-testid="premium-session-sync" />,
}));

vi.mock("lucide-react", () => ({
	CheckCircle2: vi.fn().mockReturnValue(null),
	XCircle: vi.fn().mockReturnValue(null),
}));

const { default: PaymentConfirmationPage } = await import("./page");

interface MakeParamsParams {
	locale?: unknown;
	paymentIntent?: string;
}

const makeParams = ({ locale = EN, paymentIntent }: MakeParamsParams = {}) => ({
	searchParams: Promise.resolve(paymentIntent ? { payment_intent: paymentIntent } : {}),
	params: Promise.resolve({ locale: locale as never }),
});

const makeSuccessParams = () => makeParams({ locale: EN, paymentIntent: PAYMENT_INTENT_ID });

const renderErrorPage = async () => {
	const element = await PaymentConfirmationPage(makeSuccessParams());
	const resolved = await (element.type as (props: unknown) => Promise<never>)(element.props);
	return render(resolved);
};

const makeFreshActivationParams = () => ({
	searchParams: Promise.resolve({ payment_intent: PAYMENT_INTENT_ID, activation: ACTIVATION_FRESH }),
	params: Promise.resolve({ locale: EN as never }),
});

const makeFailedActivationParams = () => ({
	searchParams: Promise.resolve({ payment_intent: PAYMENT_INTENT_ID, activation: ACTIVATION_FAILED }),
	params: Promise.resolve({ locale: EN as never }),
});

const SUCCESS_CONFIRMATION: PaymentConfirmationDTO = {
	id: PAYMENT_INTENT_ID,
	status: "succeeded",
	amount: 10,
	currency: "USD",
};

describe("payment/confirmation page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetTranslations.mockResolvedValue(vi.fn((key: string) => `t:${key}`));
		mockGetFormatter.mockResolvedValue(createFormatter({ locale: EN }));
		mockConfirmation.mockReturnValue(Effect.succeed(SUCCESS_CONFIRMATION));
	});

	describe("redirect", () => {
		beforeEach(() => {
			mockRedirect.mockImplementation(() => {
				throw new Error("NEXT_REDIRECT");
			});
		});

		it("sends an English visitor with no payment_intent to the unprefixed home", async () => {
			await expect(PaymentConfirmationPage(makeParams({ locale: EN }))).rejects.toThrow("NEXT_REDIRECT");
			expect(mockRedirect).toHaveBeenCalledExactlyOnceWith("/");
		});

		it("sends any other visitor with no payment_intent to the home under their locale prefix", async () => {
			await expect(PaymentConfirmationPage(makeParams({ locale: ES }))).rejects.toThrow("NEXT_REDIRECT");
			expect(mockRedirect).toHaveBeenCalledExactlyOnceWith(`/${ES}`);
		});
	});

	describe("query string", () => {
		it.each([
			["a repeated payment_intent", { payment_intent: [PAYMENT_INTENT_ID, "pi_other"] }],
			["a repeated activation flag", { payment_intent: PAYMENT_INTENT_ID, activation: [ACTIVATION_FAILED] }],
		])("redirects home without reading Stripe when the query carries %s", async (_label, query) => {
			mockRedirect.mockImplementation(() => {
				throw new Error("NEXT_REDIRECT");
			});
			await expect(
				PaymentConfirmationPage({
					searchParams: Promise.resolve(query),
					params: Promise.resolve({ locale: EN as never }),
				}),
			).rejects.toThrow("NEXT_REDIRECT");
			expect(mockRedirect).toHaveBeenCalledExactlyOnceWith("/");
			expect(mockConfirmation).not.toHaveBeenCalled();
		});
	});

	describe("PaymentError state", () => {
		it("returns PaymentError component when confirmation returns null", async () => {
			mockConfirmation.mockReturnValueOnce(Effect.succeed(null));
			const element = await PaymentConfirmationPage(makeSuccessParams());
			expect(typeof element.type).toBe("function");
			expect((element.type as { name?: string }).name).toBe("PaymentError");
		});

		it("returns PaymentError component when status is not succeeded", async () => {
			mockConfirmation.mockReturnValueOnce(
				Effect.succeed({ id: PAYMENT_INTENT_ID, status: "processing", amount: 10, currency: "USD" }),
			);
			const element = await PaymentConfirmationPage(makeSuccessParams());
			expect(typeof element.type).toBe("function");
			expect((element.type as { name?: string }).name).toBe("PaymentError");
		});

		it("does not claim the payer was spared when Stripe says the payment is still processing", async () => {
			mockConfirmation.mockReturnValueOnce(
				Effect.succeed({ id: PAYMENT_INTENT_ID, status: "processing", amount: 10, currency: "USD" }),
			);
			const { container } = await renderErrorPage();
			expect(container.textContent).toContain("t:unconfirmedTitle");
			expect(container.textContent).not.toContain("t:description");
		});

		it("does not claim the payer was spared when the Stripe read itself failed", async () => {
			mockConfirmation.mockReturnValueOnce(Effect.succeed(null));
			const { container } = await renderErrorPage();
			expect(container.textContent).toContain("t:unconfirmedTitle");
		});

		it("translates the failure card in the locale of the route", async () => {
			mockConfirmation.mockReturnValueOnce(Effect.succeed(null));
			const element = await PaymentConfirmationPage(makeParams({ locale: DE, paymentIntent: PAYMENT_INTENT_ID }));
			await (element.type as (props: unknown) => Promise<never>)(element.props);
			expect(mockGetTranslations).toHaveBeenCalledWith({ locale: DE, namespace: "paymentConfirmation.failed" });
		});

		it("still says the card was untouched when Stripe says the intent was never charged", async () => {
			mockConfirmation.mockReturnValueOnce(
				Effect.succeed({ id: PAYMENT_INTENT_ID, status: "requires_payment_method", amount: 10, currency: "USD" }),
			);
			const { container } = await renderErrorPage();
			expect(container.textContent).toContain("t:description");
			expect(container.textContent).not.toContain("t:unconfirmedTitle");
		});
	});

	describe("success state", () => {
		it("returns a main landmark on success", async () => {
			const element = await PaymentConfirmationPage(makeSuccessParams());
			expect(element.type).toBe("main");
		});

		it("success landmark has m-auto class", async () => {
			const element = await PaymentConfirmationPage(makeSuccessParams());
			expect(element.props.className).toContain("m-auto");
		});

		it("translates the success card in the locale of the route", async () => {
			await PaymentConfirmationPage(makeParams({ locale: DE, paymentIntent: PAYMENT_INTENT_ID }));
			expect(mockGetTranslations).toHaveBeenCalledWith({ locale: DE, namespace: "paymentConfirmation.success" });
		});

		it("builds the formatter for the requested locale", async () => {
			await PaymentConfirmationPage(makeParams({ locale: DE, paymentIntent: PAYMENT_INTENT_ID }));
			expect(mockGetFormatter).toHaveBeenCalledWith({ locale: DE });
		});

		it("reports Premium as active when the activation route did not flag a failure", async () => {
			const { container } = render(await PaymentConfirmationPage(makeSuccessParams()));
			expect(container.textContent).toContain("t:premiumActivated");
			expect(container.textContent).not.toContain("t:premiumActivationFailed");
		});

		it("never claims Premium is active when the activation route says it failed", async () => {
			const { container } = render(await PaymentConfirmationPage(makeFailedActivationParams()));
			expect(container.textContent).toContain("t:premiumActivationFailed");
			expect(container.textContent).not.toContain("t:premiumActivated");
		});

		it("reports Premium as active for the activation the redirect just made", async () => {
			const { container } = render(await PaymentConfirmationPage(makeFreshActivationParams()));
			expect(container.textContent).toContain("t:premiumActivated");
			expect(container.textContent).not.toContain("t:premiumActivationFailed");
		});

		it.each([
			["an ordinary load", makeSuccessParams],
			["the activation the redirect just made", makeFreshActivationParams],
		])("mounts the session sync for %s", async (_label, makeQuery) => {
			const { queryByTestId } = render(await PaymentConfirmationPage(makeQuery()));
			expect(queryByTestId("premium-session-sync")).not.toBeNull();
		});

		it("mounts no session sync when the activation route says it failed, since there is no cookie to restore", async () => {
			const { queryByTestId } = render(await PaymentConfirmationPage(makeFailedActivationParams()));
			expect(queryByTestId("premium-session-sync")).toBeNull();
		});
	});

	describe("amount formatting", () => {
		interface RenderAmountParams {
			locale: Locale;
			currency: string;
			amount: number;
		}

		const renderAmount = async ({ locale, currency, amount }: RenderAmountParams) => {
			mockGetFormatter.mockResolvedValue(createFormatter({ locale }));
			mockConfirmation.mockReturnValueOnce(
				Effect.succeed({ id: PAYMENT_INTENT_ID, status: "succeeded", amount, currency }),
			);
			const { container } = render(
				await PaymentConfirmationPage(makeParams({ locale, paymentIntent: PAYMENT_INTENT_ID })),
			);
			return (container.textContent ?? "").replace(NON_BREAKING_SPACES, " ");
		};

		it("renders a German amount with comma decimals and a trailing symbol", async () => {
			expect(await renderAmount({ locale: DE, currency: "eur", amount: 12.5 })).toContain("12,50 €");
		});

		it("renders an English amount with a leading symbol and dot decimals", async () => {
			expect(await renderAmount({ locale: EN, currency: "usd", amount: 12.5 })).toContain("$12.50");
		});

		it("groups thousands in the amount", async () => {
			expect(await renderAmount({ locale: EN, currency: "usd", amount: 1234.5 })).toContain("$1,234.50");
		});
	});
});
