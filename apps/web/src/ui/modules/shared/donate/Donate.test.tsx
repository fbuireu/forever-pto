import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { initializePayment, track, logClientError, toastError, toastSuccess, recoverFromStaleDeployment, promoCode } =
	vi.hoisted(() => ({
		initializePayment: vi.fn(),
		track: vi.fn(),
		logClientError: vi.fn(),
		toastError: vi.fn(),
		toastSuccess: vi.fn(),
		recoverFromStaleDeployment: vi.fn(() => false),
		promoCode: { current: "" },
	}));

const premiumState = { premiumKey: null, userEmail: null, setEmail: vi.fn() };
const uiState = {
	donatePopoverOpen: false,
	donatePopoverIsOpening: false,
	setDonatePopoverOpen: vi.fn(),
	clearDonatePopoverOpening: vi.fn(),
};

interface DonationFormMockProps {
	onSubmit: (data: { amount: number; email: string; promoCode: string }) => void;
	isPending: boolean;
}

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));
vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: typeof uiState) => unknown) => selector(uiState),
}));
vi.mock("@application/shared/utils/clientLog", () => ({ logClientError }));
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));
vi.mock("@infrastructure/clients/payments/stripe/client", () => ({
	getStripeClientInstance: () => ({ getStripePromise: () => Promise.resolve(null) }),
}));
vi.mock("@stripe/react-stripe-js", () => ({ Elements: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@ui/adapters/navigation/staleDeployment", () => ({ recoverFromStaleDeployment }));
vi.mock("@ui/adapters/payments/checkout", () => ({ initializePayment }));
vi.mock("@ui/modules/core/animate/base/Popover", () => ({
	Popover: ({ children, onOpenChange }: { children: ReactNode; onOpenChange: (open: boolean) => void }) => (
		<div>
			<button type="button" onClick={() => onOpenChange(false)}>
				dismiss
			</button>
			{children}
		</div>
	),
	PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
	PopoverContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@ui/modules/core/animate/icons/Star", () => ({ Star: () => null }));
vi.mock("@ui/modules/premium/CheckoutForm", () => ({
	CheckoutForm: ({ amount, onSuccess, onCancel }: { amount: number; onSuccess: () => void; onCancel: () => void }) => (
		<div data-testid="checkout" data-amount={amount}>
			<button type="button" onClick={onSuccess}>
				paid
			</button>
			<button type="button" onClick={onCancel}>
				back
			</button>
		</div>
	),
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));
vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: toastError } }));
vi.mock("./DonationForm", () => ({
	DonationForm: ({ onSubmit, isPending }: DonationFormMockProps) => (
		<button
			type="button"
			data-pending={String(isPending)}
			onClick={() => onSubmit({ amount: 10, email: "someone@example.test", promoCode: promoCode.current })}
		>
			donate
		</button>
	),
}));
vi.mock("./donate.css", () => ({}));

import { Donate } from "./Donate";

const renderDonate = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<Donate />
		</NextIntlClientProvider>,
	);

const trigger = (container: HTMLElement) => container.querySelector(".donate-trigger") as HTMLElement;

describe("Donate trigger band", () => {
	it("lets taps through the fixed band it spans below md", () => {
		const { container } = renderDonate();
		expect(trigger(container).className).toContain("pointer-events-none");
	});

	it("keeps the button itself interactive inside that band", () => {
		const { container } = renderDonate();
		expect(trigger(container).querySelector(".donate-brutal")?.className).toContain("pointer-events-auto");
	});

	it("stays full-bleed below md and hugs its content from md up", () => {
		const { container } = renderDonate();
		expect(trigger(container).className).toContain("w-full");
		expect(trigger(container).className).toContain("md:w-auto");
	});
});

const donate = () => fireEvent.click(screen.getByRole("button", { name: "donate" }));

const trackedEvents = () => track.mock.calls.map(([call]) => (call as { event: string }).event);

beforeEach(() => {
	promoCode.current = "";
	initializePayment.mockReset();
	initializePayment.mockResolvedValue({ clientSecret: "cs_test", discountInfo: null });
	track.mockClear();
	logClientError.mockClear();
	toastError.mockClear();
	toastSuccess.mockClear();
	recoverFromStaleDeployment.mockReset();
	recoverFromStaleDeployment.mockReturnValue(false);
	premiumState.setEmail.mockClear();
	uiState.setDonatePopoverOpen.mockClear();
});

describe("starting a donation", () => {
	it("remembers the address before it asks for money, since the receipt goes there", async () => {
		renderDonate();

		donate();

		await waitFor(() => expect(premiumState.setEmail).toHaveBeenCalledExactlyOnceWith("someone@example.test"));
	});

	it("reports the attempt whether or not a promo code was typed", async () => {
		renderDonate();

		donate();

		await waitFor(() => expect(trackedEvents()).toStrictEqual(["payment_started"]));
		expect(track.mock.calls[0]?.[0]).toMatchObject({
			properties: { amount: 10, currency: "EUR", hasPromoCode: false },
		});
	});

	it("says a code was used without putting the code itself in the report", async () => {
		promoCode.current = "FOREVER";
		renderDonate();

		donate();

		await waitFor(() => expect(track).toHaveBeenCalled());
		expect(JSON.stringify(track.mock.calls)).not.toContain("FOREVER");
		expect(track.mock.calls.at(-1)?.[0]).toMatchObject({ properties: { hasPromoCode: true } });
	});
});

describe("a donation with a discount on it", () => {
	beforeEach(() => {
		initializePayment.mockResolvedValue({
			clientSecret: "cs_test",
			discountInfo: { type: "percentage", value: 50, originalAmount: 10, finalAmount: 5 },
		});
	});

	it("says what was saved, in money rather than in a percentage", async () => {
		renderDonate();

		donate();

		await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(enMessages.toasts.promoApplied, expect.anything()));
		const description = toastSuccess.mock.calls[0]?.[1] as { description: string };
		expect(description.description).toContain("€5.00");
		expect(description.description).toContain("€10.00");
	});

	it("reports the discount before the payment, so the funnel carries both", async () => {
		renderDonate();

		donate();

		await waitFor(() => expect(trackedEvents()).toStrictEqual(["promo_code_applied", "payment_started"]));
	});

	it("charges the discounted amount, not the one typed", async () => {
		renderDonate();

		donate();

		await waitFor(() => expect(screen.getByTestId("checkout").getAttribute("data-amount")).toBe("5"));
	});
});

describe("once the checkout is on screen", () => {
	const openCheckout = async () => {
		renderDonate();
		donate();
		await waitFor(() => expect(screen.getByTestId("checkout")).toBeDefined());
	};

	it("swaps the form for the checkout at the amount the form holds when nothing was discounted", async () => {
		await openCheckout();

		expect(screen.getByTestId("checkout").getAttribute("data-amount")).toBe("5");
		expect(screen.queryByRole("button", { name: "donate" })).toBeNull();
	});

	it("thanks the donor, closes the popover and returns to a fresh form after a successful payment", async () => {
		await openCheckout();

		fireEvent.click(screen.getByRole("button", { name: "paid" }));

		expect(toastSuccess).toHaveBeenCalledWith(enMessages.toasts.paymentSuccess, {
			description: enMessages.toasts.paymentSuccessDescription,
			duration: 8000,
		});
		expect(uiState.setDonatePopoverOpen).toHaveBeenCalledExactlyOnceWith(false);
		expect(screen.getByRole("button", { name: "donate" })).toBeDefined();
	});

	it("returns to the form when the checkout is abandoned, leaving the popover open", async () => {
		await openCheckout();

		fireEvent.click(screen.getByRole("button", { name: "back" }));

		expect(screen.getByRole("button", { name: "donate" })).toBeDefined();
		expect(uiState.setDonatePopoverOpen).not.toHaveBeenCalled();
	});
});

describe("the popover's open state", () => {
	it("is written to the ui store, which every other trigger reads", () => {
		renderDonate();

		fireEvent.click(screen.getByRole("button", { name: "dismiss" }));

		expect(uiState.setDonatePopoverOpen).toHaveBeenCalledExactlyOnceWith(false);
	});
});

describe("a donation that never starts", () => {
	it("names the reason a promo code was refused rather than reporting a generic failure", async () => {
		const { PromoCodeError, PromoCodeErrors } = await import("@infrastructure/errors");
		initializePayment.mockRejectedValue(new PromoCodeError({ code: PromoCodeErrors.USAGE_LIMIT_REACHED }));
		renderDonate();

		donate();

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith(enMessages.toasts.promoCodeError, {
				description: enMessages.toasts.promoCodeErrors.usage_limit_reached,
			}),
		);
	});

	it("has a message for every code it can be refused with", async () => {
		const { PromoCodeError, PromoCodeErrors } = await import("@infrastructure/errors");

		for (const code of Object.values(PromoCodeErrors)) {
			toastError.mockClear();
			initializePayment.mockRejectedValue(new PromoCodeError({ code }));
			const view = renderDonate();

			donate();

			await waitFor(() => expect(toastError).toHaveBeenCalled());
			expect(toastError.mock.calls[0]?.[1]).toStrictEqual({
				description: enMessages.toasts.promoCodeErrors[code],
			});
			view.unmount();
		}
	});

	it("falls back to a generic failure for anything else, and leaves a record", async () => {
		initializePayment.mockRejectedValue(new Error("network"));
		renderDonate();

		donate();

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith(enMessages.toasts.paymentFailed, {
				description: enMessages.toasts.paymentFailedDescription,
			}),
		);
		expect(logClientError).toHaveBeenCalledOnce();
	});

	it("says nothing at all when the failure was a stale deployment, which reloads instead", async () => {
		initializePayment.mockRejectedValue(new Error("NEXT_ACTION_NOT_FOUND"));
		recoverFromStaleDeployment.mockReturnValue(true);
		renderDonate();

		donate();

		await waitFor(() => expect(recoverFromStaleDeployment).toHaveBeenCalled());
		expect(toastError).not.toHaveBeenCalled();
		expect(logClientError).not.toHaveBeenCalled();
	});
});
