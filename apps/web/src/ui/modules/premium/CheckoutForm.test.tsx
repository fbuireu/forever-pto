import type { DiscountInfo } from "@application/dto/payment/types";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import { CONFETTI_COLORS } from "@styles/palette";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const premiumState = { setPremiumStatus: vi.fn() };

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track: vi.fn() }));
vi.mock("@ui/adapters/payments/checkout", () => ({
	confirmPayment: vi.fn(),
	ConfirmPaymentOutcome: {
		SUCCEEDED: "succeeded",
		REFUSED_BEFORE_CHARGE: "refused_before_charge",
		FAILED_AFTER_CHARGE: "failed_after_charge",
		HANDED_OFF_TO_ISSUER: "handed_off_to_issuer",
	},
}));
interface ExpressCheckoutMockProps {
	onConfirm: () => void;
	onReady: (event: { availablePaymentMethods?: Record<string, boolean> }) => void;
}

vi.mock("@stripe/react-stripe-js", () => ({
	ExpressCheckoutElement: ({ onConfirm, onReady }: ExpressCheckoutMockProps) => (
		<>
			<button type="button" onClick={onConfirm}>
				express confirm
			</button>
			<button type="button" onClick={() => onReady({ availablePaymentMethods: { applePay: true } })}>
				express ready
			</button>
			<button type="button" onClick={() => onReady({})}>
				express ready with nothing
			</button>
		</>
	),
	PaymentElement: () => null,
	useElements: () => ({}),
	useStripe: () => ({}),
}));

const confettiFills = vi.hoisted(() => new Set<string>());
const drawingContext = new Proxy(
	{},
	{
		get: () => () => undefined,
		set: (_target, property, value) => {
			if (property === "fillStyle") confettiFills.add(String(value));
			return true;
		},
	},
);
vi.mock("boneyard-js/react", () => ({ Skeleton: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@ui/modules/core/animate/icons/Icon", () => ({
	AnimateIcon: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@ui/modules/core/animate/icons/ChevronLeft", () => ({ ChevronLeft: () => null }));
vi.mock("./ExpressCheckoutFixture", () => ({ ExpressCheckoutFixture: () => null }));

import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { ConfirmPaymentOutcome, confirmPayment } from "@ui/adapters/payments/checkout";
import { CheckoutForm } from "./CheckoutForm";

const NON_BREAKING_SPACES = /[  ]/g;

const DISCOUNT: DiscountInfo = {
	type: "fixed",
	value: 2.5,
	originalAmount: 15,
	finalAmount: 12.5,
	couponId: "coupon_launch",
	couponName: "Launch",
};

interface RenderFormParams {
	locale: Locale;
	messages: object;
	amount: number;
	discountInfo?: DiscountInfo | null;
}

const renderForm = ({ locale, messages, amount, discountInfo = null }: RenderFormParams) => {
	const { container } = render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<CheckoutForm
				amount={amount}
				email="donor@example.com"
				discountInfo={discountInfo}
				onSuccess={vi.fn()}
				onCancel={vi.fn()}
			/>
		</NextIntlClientProvider>,
	);
	return (container.textContent ?? "").replace(NON_BREAKING_SPACES, " ");
};

describe("CheckoutForm amount rendering", () => {
	it("renders the German amount with comma decimals and a trailing symbol", () => {
		expect(renderForm({ locale: "de", messages: deMessages, amount: 12.5 })).toContain("12,50 €");
	});

	it("renders the English amount with a leading symbol and dot decimals", () => {
		expect(renderForm({ locale: "en", messages: enMessages, amount: 12.5 })).toContain("€12.50");
	});

	it("formats the amount on the pay button too", () => {
		const text = renderForm({ locale: "de", messages: deMessages, amount: 12.5 });
		expect(text).toContain("Bezahlen 12,50 €");
	});

	it("formats the promo saving instead of prefixing a hardcoded euro sign", () => {
		const text = renderForm({ locale: "de", messages: deMessages, amount: 12.5, discountInfo: DISCOUNT });
		expect(text).toContain(deMessages.checkout.promoSaved.replace("{saved}", "2,50 €"));
	});
});

const INTERNAL_ERROR_MESSAGE = "Something went wrong on our side. Please try again later.";
const messagesWithErrors = {
	...enMessages,
	checkout: { ...enMessages.checkout, errors: { internal_error: INTERNAL_ERROR_MESSAGE } },
};

const submitPayment = async (messages: object) => {
	const { container } = render(
		<NextIntlClientProvider locale="en" messages={messages}>
			<CheckoutForm
				amount={12.5}
				email="donor@example.com"
				discountInfo={null}
				onSuccess={vi.fn()}
				onCancel={vi.fn()}
			/>
		</NextIntlClientProvider>,
	);
	const form = container.querySelector("form");
	if (!form) throw new Error("checkout form did not render");
	fireEvent.submit(form);
};

describe("CheckoutForm failure reporting", () => {
	it("renders the translated message for a machine code instead of the code itself", async () => {
		vi.mocked(confirmPayment).mockResolvedValue({
			outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE,
			error: "internal_error",
		});

		await submitPayment(messagesWithErrors);

		await waitFor(() => expect(screen.getByText(INTERNAL_ERROR_MESSAGE)).toBeTruthy());
		expect(screen.queryByText("internal_error")).toBeNull();
	});

	it("never tells a payer their card was not charged when it was, and activation is what failed", async () => {
		vi.mocked(confirmPayment).mockResolvedValue({
			outcome: ConfirmPaymentOutcome.FAILED_AFTER_CHARGE,
			error: "internal_error",
		});

		await submitPayment(messagesWithErrors);

		await waitFor(() => expect(screen.getByText(enMessages.checkout.activationFailed)).toBeTruthy());
		expect(screen.queryByText(INTERNAL_ERROR_MESSAGE)).toBeNull();
		expect(screen.queryByText(enMessages.checkout.paymentFailed)).toBeNull();
	});

	it("falls back to the generic message when the code has no key of its own", async () => {
		vi.mocked(confirmPayment).mockResolvedValue({
			outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE,
			error: "webhook_processing_failed",
		});

		await submitPayment(messagesWithErrors);

		await waitFor(() => expect(screen.getByText(enMessages.checkout.paymentFailed)).toBeTruthy());
	});

	it("keeps the prose Stripe already localised", async () => {
		vi.mocked(confirmPayment).mockResolvedValue({
			outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE,
			error: "Your card was declined.",
		});

		await submitPayment(messagesWithErrors);

		await waitFor(() => expect(screen.getByText("Your card was declined.")).toBeTruthy());
	});

	it("sends the machine code to analytics, never the translated message", async () => {
		vi.mocked(confirmPayment).mockResolvedValue({
			outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE,
			error: "internal_error",
		});

		await submitPayment(messagesWithErrors);

		await waitFor(() =>
			expect(vi.mocked(track)).toHaveBeenCalledWith({
				event: "payment_failed",
				properties: { error: "internal_error" },
			}),
		);
	});

	it("reports a stable code to analytics when the failure carries none", async () => {
		vi.mocked(confirmPayment).mockResolvedValue({ outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE, error: "" });

		await submitPayment(messagesWithErrors);

		await waitFor(() =>
			expect(vi.mocked(track)).toHaveBeenCalledWith({
				event: "payment_failed",
				properties: { error: "unknown_error" },
			}),
		);
	});
});

interface RenderCheckoutParams {
	onSuccess?: () => void;
	onCancel?: () => void;
}

const renderCheckout = ({ onSuccess = vi.fn(), onCancel = vi.fn() }: RenderCheckoutParams = {}) => {
	const { container } = render(
		<NextIntlClientProvider locale="en" messages={messagesWithErrors}>
			<CheckoutForm
				amount={12.5}
				email="donor@example.com"
				discountInfo={null}
				onSuccess={onSuccess}
				onCancel={onCancel}
			/>
		</NextIntlClientProvider>,
	);
	const submit = () => {
		const form = container.querySelector("form");
		if (!form) throw new Error("checkout form did not render");
		fireEvent.submit(form);
	};
	return { container, submit, onSuccess, onCancel };
};

const succeeds = () =>
	vi.mocked(confirmPayment).mockResolvedValue({
		outcome: ConfirmPaymentOutcome.SUCCEEDED,
		sessionData: { email: "donor@example.com", premiumKey: "key_123" },
	});

beforeEach(() => {
	confettiFills.clear();
	vi.mocked(track).mockClear();
	vi.mocked(confirmPayment).mockReset();
	premiumState.setPremiumStatus.mockClear();
	vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext as never);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("a payment that goes through", () => {
	it("grants Premium from what the session came back with, not from what was typed", async () => {
		succeeds();
		const { submit } = renderCheckout();

		submit();

		await waitFor(() =>
			expect(premiumState.setPremiumStatus).toHaveBeenCalledExactlyOnceWith({
				email: "donor@example.com",
				premiumKey: "key_123",
			}),
		);
	});

	it("throws the confetti in the palette module's colours, since the canvas cannot read a custom property", async () => {
		succeeds();
		const { submit } = renderCheckout();
		const channels = (hex: string) =>
			[1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16)).join(", ");
		const palette = CONFETTI_COLORS.map(channels);

		submit();

		await waitFor(() => expect(confettiFills.size).toBeGreaterThan(0));
		const unknown = [...confettiFills].filter((fill) => !palette.some((rgb) => fill.startsWith(`rgba(${rgb}, `)));
		expect(unknown).toEqual([]);
	});

	it("reports the amount that was actually taken, and nothing about the payer", async () => {
		succeeds();
		const { submit } = renderCheckout();

		submit();

		await waitFor(() => expect(premiumState.setPremiumStatus).toHaveBeenCalled());
		expect(vi.mocked(track).mock.calls).toStrictEqual([[{ event: "payment_completed", properties: { amount: 12.5 } }]]);
	});

	it("sends the issuer back to the activation route, which grants Premium, in the reader's locale", async () => {
		succeeds();
		const { submit } = renderCheckout();

		submit();

		await waitFor(() => expect(vi.mocked(confirmPayment)).toHaveBeenCalledOnce());
		expect(vi.mocked(confirmPayment).mock.calls[0]?.[0].returnUrl).toBe(
			`${globalThis.location.origin}/api/payment/activate?locale=en`,
		);
	});

	it("leaves the confirmation on screen for a moment before handing back", async () => {
		succeeds();
		const { submit, onSuccess } = renderCheckout();

		submit();
		await waitFor(() => expect(premiumState.setPremiumStatus).toHaveBeenCalled());

		expect(onSuccess).not.toHaveBeenCalled();
		await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce(), { timeout: 2000 });
	});

	it("hands back at once when the checkout leaves the screen during that moment, so the hand-back is never dropped", async () => {
		succeeds();
		const onSuccess = vi.fn();
		const { submit } = renderCheckout({ onSuccess });

		submit();
		await waitFor(() => expect(premiumState.setPremiumStatus).toHaveBeenCalled());
		cleanup();

		expect(onSuccess).toHaveBeenCalledOnce();
	});

	it("hands back exactly once and reports the payment exactly once, however the moment ends", async () => {
		succeeds();
		const onSuccess = vi.fn();
		const { submit } = renderCheckout({ onSuccess });

		submit();
		await waitFor(() => expect(premiumState.setPremiumStatus).toHaveBeenCalled());
		cleanup();
		await act(() => new Promise((resolve) => setTimeout(resolve, 1100)));

		expect(onSuccess).toHaveBeenCalledOnce();
		expect(premiumState.setPremiumStatus).toHaveBeenCalledOnce();
		expect(vi.mocked(track).mock.calls).toStrictEqual([[{ event: "payment_completed", properties: { amount: 12.5 } }]]);
	});

	it("goes back when Back is pressed before anything is paid", () => {
		const { onCancel } = renderCheckout();

		fireEvent.click(screen.getByRole("button", { name: enMessages.checkout.goBackToDonation }));

		expect(onCancel).toHaveBeenCalledOnce();
	});

	it("neither cancels nor pays again while the confirmation is on screen, whichever control is pressed", async () => {
		succeeds();
		const { submit, onCancel } = renderCheckout();
		const pay = () => screen.getByRole("button", { name: enMessages.checkout.payAmount.replace("{amount}", "€12.50") });

		submit();
		await waitFor(() => expect(pay()).toBeTruthy());

		fireEvent.click(screen.getByRole("button", { name: enMessages.checkout.goBackToDonation }));
		fireEvent.click(pay());
		fireEvent.click(screen.getByRole("button", { name: "express confirm" }));

		expect(onCancel).not.toHaveBeenCalled();
		expect(vi.mocked(confirmPayment)).toHaveBeenCalledOnce();
		expect(vi.mocked(track).mock.calls).toStrictEqual([[{ event: "payment_completed", properties: { amount: 12.5 } }]]);
	});

	it("leaves Back and Pay disabled once the payment has gone through", async () => {
		succeeds();
		const { submit } = renderCheckout();

		submit();
		await waitFor(() => expect(premiumState.setPremiumStatus).toHaveBeenCalled());

		await waitFor(() =>
			expect(
				[enMessages.checkout.goBackToDonation, enMessages.checkout.payAmount.replace("{amount}", "€12.50")].map(
					(name) => screen.getByRole<HTMLButtonElement>("button", { name }).disabled,
				),
			).toEqual([true, true]),
		);
	});

	it("hands back once when the moment ends before the checkout leaves the screen", async () => {
		succeeds();
		const onSuccess = vi.fn();
		const { submit } = renderCheckout({ onSuccess });

		submit();
		await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce(), { timeout: 2000 });
		cleanup();

		expect(onSuccess).toHaveBeenCalledOnce();
	});

	it("shows no failure message on the way through", async () => {
		succeeds();
		const { submit } = renderCheckout();

		submit();

		await waitFor(() => expect(premiumState.setPremiumStatus).toHaveBeenCalled());
		expect(screen.queryByText(enMessages.checkout.paymentFailed)).toBeNull();
		expect(screen.queryByText(enMessages.checkout.activationFailed)).toBeNull();
	});
});

describe("a payment the issuer took over", () => {
	it("says nothing and grants nothing, because the browser has already left", async () => {
		vi.mocked(confirmPayment).mockResolvedValue({ outcome: ConfirmPaymentOutcome.HANDED_OFF_TO_ISSUER });
		const { submit, onSuccess } = renderCheckout();

		submit();

		await waitFor(() => expect(vi.mocked(confirmPayment)).toHaveBeenCalled());
		await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

		expect(premiumState.setPremiumStatus).not.toHaveBeenCalled();
		expect(onSuccess).not.toHaveBeenCalled();
		expect(screen.queryByText(enMessages.checkout.paymentFailed)).toBeNull();
		expect(vi.mocked(track)).not.toHaveBeenCalled();
	});
});

describe("paying through the express button", () => {
	it("runs the same confirmation the form does", async () => {
		succeeds();
		renderCheckout();

		fireEvent.click(screen.getByRole("button", { name: "express confirm" }));

		await waitFor(() => expect(premiumState.setPremiumStatus).toHaveBeenCalledOnce());
	});

	it("reports a refusal there the same way", async () => {
		vi.mocked(confirmPayment).mockResolvedValue({
			outcome: ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE,
			error: "internal_error",
		});
		renderCheckout();

		fireEvent.click(screen.getByRole("button", { name: "express confirm" }));

		await waitFor(() => expect(screen.getByText(INTERNAL_ERROR_MESSAGE)).toBeTruthy());
	});

	it("keeps the skeleton up until Stripe says the button is ready", () => {
		const { container } = renderCheckout();

		expect(container.querySelector(".invisible")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "express ready" }));

		expect(container.querySelector(".invisible")).toBeNull();
	});

	it("stops waiting even when Stripe offers no wallet at all", () => {
		const { container } = renderCheckout();

		fireEvent.click(screen.getByRole("button", { name: "express ready with nothing" }));

		expect(container.querySelector(".invisible")).toBeNull();
	});
});
