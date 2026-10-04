import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadStripe = vi.hoisted(() => vi.fn());

vi.mock("@stripe/stripe-js/pure", () => ({ loadStripe }));
vi.mock("@stripe/react-stripe-js", () => ({
	Elements: ({ stripe, children }: { stripe: unknown; children: ReactNode }) => (
		<div data-testid="elements" data-has-stripe={String(stripe !== null)}>
			{children}
		</div>
	),
}));
vi.mock("@ui/modules/core/animate/icons/Icon", () => ({
	AnimateIcon: ({ children }: { children: ReactNode }) => children,
	IconWrapper: () => null,
	useAnimateIconContext: () => ({ controls: undefined }),
	useVariants: () => ({}),
}));

import { StripeElementsProvider } from "./StripeElementsProvider";

const stripe = { confirmPayment: vi.fn() };
const copy = enMessages.checkout;

const open = () =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<StripeElementsProvider options={{ clientSecret: "cs_test" }} onCancel={vi.fn()}>
				<div data-testid="checkout">checkout</div>
			</StripeElementsProvider>
		</NextIntlClientProvider>,
	);

beforeEach(() => {
	vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_123");
	loadStripe.mockReset();
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("the checkout over the real Stripe client", () => {
	it("asks the library to load Stripe.js again each time the checkout opens after a failure", async () => {
		loadStripe.mockRejectedValue(new Error("Failed to load Stripe.js"));

		const first = open();
		await screen.findByText(copy.formUnavailable);
		first.unmount();
		const second = open();
		await screen.findByText(copy.formUnavailable);
		second.unmount();

		expect(loadStripe).toHaveBeenCalledTimes(2);
		expect(loadStripe).toHaveBeenNthCalledWith(1, "pk_test_123");
		expect(loadStripe).toHaveBeenNthCalledWith(2, "pk_test_123");
	});

	it("loads Stripe.js again when the visitor tries again, and shows the checkout when it loads", async () => {
		loadStripe.mockRejectedValueOnce(new Error("Failed to load Stripe.js"));
		loadStripe.mockResolvedValue(stripe);

		open();
		fireEvent.click(await screen.findByRole("button", { name: copy.tryAgain }));

		await waitFor(() => expect(screen.getByTestId("elements").getAttribute("data-has-stripe")).toBe("true"));
		expect(screen.getByTestId("checkout")).toBeDefined();
		expect(loadStripe).toHaveBeenCalledTimes(2);
	});
});
