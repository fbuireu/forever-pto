import enMessages from "@i18n/messages/en.json";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getStripePromise, logClientError } = vi.hoisted(() => ({
	getStripePromise: vi.fn<() => Promise<unknown>>(),
	logClientError: vi.fn(),
}));

interface ElementsMockProps {
	stripe: unknown;
	options: unknown;
	children: ReactNode;
}

vi.mock("@infrastructure/clients/payments/stripe/client", () => ({
	getStripeClientInstance: () => ({ getStripePromise }),
}));
vi.mock("@application/shared/utils/clientLog", () => ({ logClientError }));
vi.mock("@stripe/react-stripe-js", () => ({
	Elements: ({ stripe, options, children }: ElementsMockProps) => (
		<div data-testid="elements" data-has-stripe={String(stripe !== null)} data-options={JSON.stringify(options)}>
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

function Probe({ onMount }: { onMount: () => void }) {
	useEffect(() => {
		onMount();
	}, [onMount]);

	return null;
}

const stripe = { confirmPayment: vi.fn() };
const OPTIONS = { clientSecret: "cs_test" };
const copy = enMessages.checkout;

const renderProvider = (onCancel = vi.fn()) =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<StripeElementsProvider options={OPTIONS} onCancel={onCancel}>
				<div data-testid="checkout">checkout</div>
			</StripeElementsProvider>
		</NextIntlClientProvider>,
	);

const failing = () => getStripePromise.mockRejectedValue(new Error("Failed to load Stripe.js"));

let consoleError: ReturnType<typeof vi.spyOn>;
let unhandled: unknown[];
const onUnhandled = (reason: unknown) => unhandled.push(reason);

beforeEach(() => {
	getStripePromise.mockReset();
	getStripePromise.mockResolvedValue(stripe);
	logClientError.mockClear();
	consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
	unhandled = [];
	process.on("unhandledRejection", onUnhandled);
});

afterEach(() => {
	process.off("unhandledRejection", onUnhandled);
	consoleError.mockRestore();
});

describe("while Stripe.js loads", () => {
	it("holds the place of the checkout with a placeholder that says it is busy, and mounts nothing of the checkout", () => {
		getStripePromise.mockReturnValue(new Promise(() => {}));

		renderProvider();

		expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
		expect(screen.queryByTestId("checkout")).toBeNull();
		expect(screen.queryByTestId("elements")).toBeNull();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("asks for Stripe.js once it mounts", async () => {
		renderProvider();

		await waitFor(() => expect(getStripePromise).toHaveBeenCalledOnce());
	});
});

describe("once Stripe.js has loaded", () => {
	it("hands Elements the instance and the options, and keeps the checkout on screen", async () => {
		renderProvider();

		await waitFor(() => expect(screen.getByTestId("elements").getAttribute("data-has-stripe")).toBe("true"));
		expect(screen.getByTestId("elements").getAttribute("data-options")).toBe(JSON.stringify(OPTIONS));
		expect(screen.getByTestId("checkout")).toBeDefined();
		expect(document.querySelector('[aria-busy="true"]')).toBeNull();
		expect(screen.queryByRole("alert")).toBeNull();
	});
});

describe("when Stripe.js cannot load", () => {
	it("replaces the placeholder with a message that says the payment form could not load, and that nothing was charged", async () => {
		failing();

		renderProvider();

		expect(await screen.findByText(copy.formUnavailable)).toBeDefined();
		expect(screen.getByText(copy.formUnavailableDescription)).toBeDefined();
		expect(screen.getByRole("alert")).toBeDefined();
		expect(screen.queryByTestId("checkout")).toBeNull();
		expect(screen.queryByTestId("elements")).toBeNull();
		expect(document.querySelector('[aria-busy="true"]')).toBeNull();
	});

	it("never mounts the checkout, whose Back would carry its own animation into an unmount a moment later", async () => {
		const mounted = vi.fn();
		failing();
		render(
			<NextIntlClientProvider locale="en" messages={enMessages}>
				<StripeElementsProvider options={OPTIONS} onCancel={vi.fn()}>
					<Probe onMount={mounted} />
				</StripeElementsProvider>
			</NextIntlClientProvider>,
		);

		await screen.findByText(copy.formUnavailable);

		expect(mounted).not.toHaveBeenCalled();
	});

	it("offers a way to try again and a way back to the donation form", async () => {
		failing();

		renderProvider();

		expect(await screen.findByRole("button", { name: copy.tryAgain })).toBeDefined();
		expect(screen.getByRole("button", { name: copy.goBackToDonation })).toBeDefined();
	});

	it("leaves no uncaught rejection and nothing at error level", async () => {
		failing();

		renderProvider();
		await screen.findByText(copy.formUnavailable);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(unhandled).toEqual([]);
		expect(consoleError).not.toHaveBeenCalled();
		expect(logClientError).not.toHaveBeenCalled();
	});

	it("goes back to the donation form through the same Back the checkout has", async () => {
		failing();
		const onCancel = vi.fn();
		renderProvider(onCancel);

		fireEvent.click(await screen.findByRole("button", { name: copy.goBackToDonation }));

		expect(onCancel).toHaveBeenCalledOnce();
	});

	it("asks for Stripe.js again when the visitor tries again, and shows the checkout once it loads", async () => {
		getStripePromise.mockRejectedValueOnce(new Error("Failed to load Stripe.js"));
		renderProvider();

		fireEvent.click(await screen.findByRole("button", { name: copy.tryAgain }));

		await waitFor(() => expect(screen.getByTestId("checkout")).toBeDefined());
		expect(getStripePromise).toHaveBeenCalledTimes(2);
		expect(screen.getByTestId("elements").getAttribute("data-has-stripe")).toBe("true");
		expect(screen.queryByText(copy.formUnavailable)).toBeNull();
	});

	it("keeps the message, and stays retryable, when the second attempt fails too", async () => {
		failing();
		renderProvider();

		fireEvent.click(await screen.findByRole("button", { name: copy.tryAgain }));

		await waitFor(() => expect(getStripePromise).toHaveBeenCalledTimes(2));
		expect(await screen.findByText(copy.formUnavailable)).toBeDefined();
		await waitFor(() =>
			expect(screen.getByRole("button", { name: copy.tryAgain }).hasAttribute("disabled")).toBe(false),
		);
		expect(unhandled).toEqual([]);
		expect(logClientError).not.toHaveBeenCalled();
	});

	it("holds the retry button while an attempt is in flight, so a second click cannot start another", async () => {
		getStripePromise.mockRejectedValueOnce(new Error("Failed to load Stripe.js"));
		renderProvider();
		const retry = await screen.findByRole("button", { name: copy.tryAgain });
		getStripePromise.mockReturnValue(new Promise(() => {}));

		fireEvent.click(retry);

		await waitFor(() =>
			expect(screen.getByRole("button", { name: copy.tryAgain }).hasAttribute("disabled")).toBe(true),
		);
		expect(screen.getByRole("button", { name: copy.tryAgain }).getAttribute("aria-busy")).toBe("true");
	});
});

describe("when the checkout goes away first", () => {
	it("makes no noise when the load ends after it left, whichever way it ends", async () => {
		let reject: (reason: Error) => void = () => {};
		getStripePromise.mockReturnValue(
			new Promise((_resolve, rejectLoad) => {
				reject = rejectLoad;
			}),
		);
		const view = renderProvider();

		view.unmount();
		await act(async () => {
			reject(new Error("Failed to load Stripe.js"));
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(consoleError).not.toHaveBeenCalled();
		expect(unhandled).toEqual([]);
	});

	it("asks again when the checkout opens again after a failure", async () => {
		failing();
		const first = renderProvider();
		await screen.findByText(copy.formUnavailable);
		first.unmount();
		getStripePromise.mockResolvedValue(stripe);

		renderProvider();

		await waitFor(() => expect(screen.getByTestId("elements").getAttribute("data-has-stripe")).toBe("true"));
		expect(getStripePromise).toHaveBeenCalledTimes(2);
	});
});
