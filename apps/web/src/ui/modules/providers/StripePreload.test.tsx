import enMessages from "@i18n/messages/en.json";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadStripe, logClientError, handedToElements } = vi.hoisted(() => ({
	loadStripe: vi.fn<(key: string) => Promise<unknown>>(),
	logClientError: vi.fn(),
	handedToElements: [] as unknown[],
}));

interface ElementsMockProps {
	stripe: unknown;
	children: ReactNode;
}

vi.mock("@stripe/stripe-js/pure", () => ({ loadStripe }));
vi.mock("@application/shared/utils/clientLog", () => ({ logClientError }));
vi.mock("@stripe/react-stripe-js", () => ({
	Elements: ({ stripe, children }: ElementsMockProps) => {
		handedToElements.push(stripe);
		return <div data-testid="elements">{children}</div>;
	},
}));
vi.mock("@ui/modules/core/animate/icons/Icon", () => ({
	AnimateIcon: ({ children }: { children: ReactNode }) => children,
	IconWrapper: () => null,
	useAnimateIconContext: () => ({ controls: undefined }),
	useVariants: () => ({}),
}));

const PUBLISHABLE_KEY = "pk_test_123";
const stripe = { confirmPayment: vi.fn() };

const freshModules = async () => {
	vi.resetModules();
	const [{ StripePreload }, { StripeElementsProvider }] = await Promise.all([
		import("./StripePreload"),
		import("@ui/modules/premium/StripeElementsProvider"),
	]);

	return { StripePreload, StripeElementsProvider };
};

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;
let unhandled: unknown[];
const onUnhandled = (reason: unknown) => unhandled.push(reason);

beforeEach(() => {
	vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", PUBLISHABLE_KEY);
	loadStripe.mockReset();
	loadStripe.mockResolvedValue(stripe);
	logClientError.mockClear();
	handedToElements.length = 0;
	consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
	consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
	unhandled = [];
	process.on("unhandledRejection", onUnhandled);
});

afterEach(() => {
	process.off("unhandledRejection", onUnhandled);
	consoleError.mockRestore();
	consoleWarn.mockRestore();
	vi.unstubAllEnvs();
});

describe("StripePreload", () => {
	it("asks for Stripe.js as the page mounts, with no checkout open, so Stripe's fraud signals see the visit", async () => {
		const { StripePreload } = await freshModules();

		const { container } = render(<StripePreload />);

		await waitFor(() => expect(loadStripe).toHaveBeenCalledExactlyOnceWith(PUBLISHABLE_KEY));
		expect(container.innerHTML).toBe("");
	});

	it("fails quietly when js.stripe.com is blocked: no uncaught rejection, no console line and no log", async () => {
		loadStripe.mockRejectedValue(new Error("Failed to load Stripe.js"));
		const { StripePreload } = await freshModules();

		render(<StripePreload />);
		await waitFor(() => expect(loadStripe).toHaveBeenCalledOnce());
		await settled();

		expect(unhandled).toEqual([]);
		expect(consoleError).not.toHaveBeenCalled();
		expect(consoleWarn).not.toHaveBeenCalled();
		expect(logClientError).not.toHaveBeenCalled();
	});

	it("asks nothing and throws nothing on a build with no publishable key, which a fresh clone runs", async () => {
		vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "");
		const { StripePreload } = await freshModules();

		expect(() => render(<StripePreload />)).not.toThrow();
		await settled();

		expect(loadStripe).not.toHaveBeenCalled();
		expect(unhandled).toEqual([]);
		expect(consoleError).not.toHaveBeenCalled();
	});

	it("hands the checkout the instance it loaded, so the payment never loads Stripe.js twice", async () => {
		const { StripePreload, StripeElementsProvider } = await freshModules();

		render(<StripePreload />);
		await waitFor(() => expect(loadStripe).toHaveBeenCalledOnce());
		render(
			<NextIntlClientProvider locale="en" messages={enMessages}>
				<StripeElementsProvider options={{ clientSecret: "cs_test" }} onCancel={vi.fn()}>
					<div data-testid="checkout">checkout</div>
				</StripeElementsProvider>
			</NextIntlClientProvider>,
		);

		await screen.findByTestId("checkout");
		expect(loadStripe).toHaveBeenCalledExactlyOnceWith(PUBLISHABLE_KEY);
		expect(handedToElements.at(-1)).toBe(stripe);
	});

	it("leaves a failed early load for the checkout to ask again, so the checkout still offers to try again", async () => {
		loadStripe.mockRejectedValueOnce(new Error("Failed to load Stripe.js"));
		const { StripePreload, StripeElementsProvider } = await freshModules();

		render(<StripePreload />);
		await waitFor(() => expect(loadStripe).toHaveBeenCalledOnce());
		await settled();
		render(
			<NextIntlClientProvider locale="en" messages={enMessages}>
				<StripeElementsProvider options={{ clientSecret: "cs_test" }} onCancel={vi.fn()}>
					<div data-testid="checkout">checkout</div>
				</StripeElementsProvider>
			</NextIntlClientProvider>,
		);

		await screen.findByTestId("checkout");
		expect(loadStripe).toHaveBeenCalledTimes(2);
		expect(handedToElements.at(-1)).toBe(stripe);
		expect(unhandled).toEqual([]);
	});
});
