import { ACTIVATION_FRESH, ACTIVATION_PARAM } from "@application/dto/payment/types";
import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmActivation = vi.fn<() => Promise<void>>();
const checkExistingSession = vi.fn<(force?: boolean) => Promise<void>>();

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (
		selector: (state: {
			confirmActivation: typeof confirmActivation;
			checkExistingSession: typeof checkExistingSession;
		}) => unknown,
	) => selector({ confirmActivation, checkExistingSession }),
}));

import { PremiumSessionSync } from "./PremiumSessionSync";

const PAGE = "/payment/confirmation";
const PAYMENT_INTENT = "pi_probe";

interface LandOnParams {
	search: string;
	hash?: string;
}

const landOn = ({ search, hash = "" }: LandOnParams) =>
	window.history.replaceState(null, "", `${PAGE}${search}${hash}`);

const redirectedSearch = `?payment_intent=${PAYMENT_INTENT}&${ACTIVATION_PARAM}=${ACTIVATION_FRESH}`;
const reloadedSearch = `?payment_intent=${PAYMENT_INTENT}`;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
	confirmActivation.mockReset().mockResolvedValue(undefined);
	checkExistingSession.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
	window.history.replaceState(null, "", "/");
});

describe("PremiumSessionSync on the page the activation redirect lands on", () => {
	beforeEach(() => landOn({ search: redirectedSearch }));

	it("confirms the activation the redirect reported, once, on mount", async () => {
		render(<PremiumSessionSync />);
		await flush();

		expect(confirmActivation).toHaveBeenCalledExactlyOnceWith();
	});

	it("runs the confirmation rather than a plain session check, which would restore Premium without counting it", async () => {
		render(<PremiumSessionSync />);
		await flush();

		expect(checkExistingSession).not.toHaveBeenCalled();
	});

	it("consumes the marker as it reads it, so a reload finds none", async () => {
		render(<PremiumSessionSync />);
		await flush();

		expect(window.location.search).toBe(reloadedSearch);
	});

	it("consumes the marker before the confirmation settles, since the store settles it with or without this page", async () => {
		const confirmation = Promise.withResolvers<void>();
		confirmActivation.mockReturnValue(confirmation.promise);

		render(<PremiumSessionSync />);

		expect(window.location.search).toBe(reloadedSearch);
		expect(confirmActivation).toHaveBeenCalledOnce();

		confirmation.resolve();
		await flush();

		expect(window.location.search).toBe(reloadedSearch);
	});

	it("consumes the marker before it asks the store to confirm, so no leave can come between the two", () => {
		const order: string[] = [];
		vi.spyOn(window.history, "replaceState").mockImplementation(() => {
			order.push("consume");
		});
		confirmActivation.mockImplementation(() => {
			order.push("confirm");
			return Promise.resolve();
		});

		render(<PremiumSessionSync />);

		expect(order).toStrictEqual(["consume", "confirm"]);
	});

	it("keeps every other parameter and the fragment when it consumes the marker", async () => {
		landOn({ search: `${redirectedSearch}&utm_source=mail`, hash: "#receipt" });

		render(<PremiumSessionSync />);
		await flush();

		expect(window.location.search).toBe(`${reloadedSearch}&utm_source=mail`);
		expect(window.location.hash).toBe("#receipt");
	});

	it("replaces the history entry instead of adding one, so Back never returns to a marked address", async () => {
		const length = window.history.length;
		const replace = vi.spyOn(window.history, "replaceState");
		const push = vi.spyOn(window.history, "pushState");

		render(<PremiumSessionSync />);
		await flush();

		expect(replace).toHaveBeenCalledOnce();
		expect(push).not.toHaveBeenCalled();
		expect(window.history.length).toBe(length);
	});

	it("hands replaceState no state of its own, so Next's patched call updates the router's address as well as the bar's", async () => {
		window.history.replaceState({ __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: {} }, "", `${PAGE}${redirectedSearch}`);
		const replace = vi.spyOn(window.history, "replaceState");

		render(<PremiumSessionSync />);
		await flush();

		expect(replace).toHaveBeenCalledExactlyOnceWith(null, "", expect.any(URL));
	});

	it("leaves an address alone that the payer goes to before the confirmation settles", async () => {
		const confirmation = Promise.withResolvers<void>();
		confirmActivation.mockReturnValue(confirmation.promise);
		render(<PremiumSessionSync />);
		await flush();

		window.history.pushState(null, "", "/planner");
		const replace = vi.spyOn(window.history, "replaceState");
		confirmation.resolve();
		await flush();

		expect(replace).not.toHaveBeenCalled();
		expect(window.location.pathname).toBe("/planner");
	});

	it("confirms once even under strict mode's doubled effects, so the cookie is not read twice", async () => {
		render(
			<StrictMode>
				<PremiumSessionSync />
			</StrictMode>,
		);
		await flush();

		expect(confirmActivation).toHaveBeenCalledOnce();
		expect(window.location.search).toBe(reloadedSearch);
	});

	it("does not confirm again on a re-render", async () => {
		const { rerender } = render(<PremiumSessionSync />);

		rerender(<PremiumSessionSync />);
		await flush();

		expect(confirmActivation).toHaveBeenCalledOnce();
	});
});

describe("PremiumSessionSync on any other load of the confirmation page", () => {
	beforeEach(() => landOn({ search: reloadedSearch }));

	it("restores the session from the cookie, once, without confirming an activation", async () => {
		render(<PremiumSessionSync />);
		await flush();

		expect(checkExistingSession).toHaveBeenCalledExactlyOnceWith(true);
		expect(confirmActivation).not.toHaveBeenCalled();
	});

	it("restores once under strict mode too", async () => {
		render(
			<StrictMode>
				<PremiumSessionSync />
			</StrictMode>,
		);
		await flush();

		expect(checkExistingSession).toHaveBeenCalledOnce();
	});

	it("does not touch the address", async () => {
		const replace = vi.spyOn(window.history, "replaceState");

		render(<PremiumSessionSync />);
		await flush();

		expect(replace).not.toHaveBeenCalled();
		expect(window.location.search).toBe(reloadedSearch);
	});

	it("takes a marker with any other value for no marker at all", async () => {
		landOn({ search: `${reloadedSearch}&${ACTIVATION_PARAM}=failed` });

		render(<PremiumSessionSync />);
		await flush();

		expect(confirmActivation).not.toHaveBeenCalled();
		expect(checkExistingSession).toHaveBeenCalledOnce();
	});
});

describe("PremiumSessionSync", () => {
	it("renders nothing", () => {
		const { container } = render(<PremiumSessionSync />);

		expect(container.childNodes).toHaveLength(0);
	});
});
