import { ACTIVATION_FRESH, ACTIVATION_PARAM } from "@application/dto/payment/types";
import { usePremiumStore } from "@application/stores/premium";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { render } from "@testing-library/react";
import { getExistingSession } from "@ui/adapters/session/checkSession";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PremiumSessionSync } from "./PremiumSessionSync";

vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track: vi.fn() }));

vi.mock("@infrastructure/logging/logger", () => ({ logger: { logError: vi.fn(), warn: vi.fn() } }));

vi.mock("@ui/adapters/session/checkSession", () => ({
	getExistingSession: vi.fn(),
	verifyPremiumEmail: vi.fn(),
}));

vi.mock("@application/stores/crypto", () => ({
	obfuscatedStorage: {
		getItem: vi.fn().mockResolvedValue(null),
		setItem: vi.fn().mockResolvedValue(undefined),
		removeItem: vi.fn().mockResolvedValue(undefined),
	},
}));

const SESSION = { premiumKey: "pk_redirect", email: "donor@example.com" };
const ACTIVATED = { event: "premium_activated", properties: { plan: "premium" } };
const REDIRECT = `/payment/confirmation?payment_intent=pi_probe&${ACTIVATION_PARAM}=${ACTIVATION_FRESH}`;

const reported = () => vi.mocked(track).mock.calls.map(([params]) => params);

const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

type Storage = "kept" | "cleared";

interface LoadParams {
	address: string;
	storage: Storage;
}

const load = async ({ address, storage }: LoadParams) => {
	window.history.replaceState(null, "", address);
	if (storage === "cleared") usePremiumStore.setState(usePremiumStore.getInitialState());

	const view = render(<PremiumSessionSync />);
	await settled();
	view.unmount();
};

const reload = (storage: Storage) => load({ address: window.location.href, storage });

beforeEach(() => {
	usePremiumStore.setState(usePremiumStore.getInitialState());
	vi.clearAllMocks();
	vi.mocked(getExistingSession).mockResolvedValue(SESSION);
});

afterEach(() => {
	window.history.replaceState(null, "", "/");
});

describe("which loads of the payment confirmation page report premium_activated", () => {
	it("reports the activation the redirect lands on, once", async () => {
		await load({ address: REDIRECT, storage: "cleared" });

		expect(reported()).toStrictEqual([ACTIVATED]);
		expect(usePremiumStore.getState().premiumKey).toBe(SESSION.premiumKey);
	});

	it("reports nothing when that page is reloaded", async () => {
		await load({ address: REDIRECT, storage: "cleared" });
		vi.mocked(track).mockClear();

		await reload("kept");

		expect(reported()).toStrictEqual([]);
	});

	it("reports nothing when that page is reloaded with the storage cleared and the cookie alive", async () => {
		await load({ address: REDIRECT, storage: "cleared" });
		vi.mocked(track).mockClear();
		usePremiumStore.setState(usePremiumStore.getInitialState());

		await reload("cleared");

		expect(reported()).toStrictEqual([]);
		expect(usePremiumStore.getState().premiumKey).toBe(SESSION.premiumKey);
	});

	it("reports nothing on an ordinary load, which only restores what the cookie holds", async () => {
		await load({ address: "/payment/confirmation?payment_intent=pi_probe", storage: "cleared" });

		expect(reported()).toStrictEqual([]);
		expect(usePremiumStore.getState().premiumKey).toBe(SESSION.premiumKey);
	});

	it("reports nothing when the planner's own session check restores the cookie, after the page was reloaded", async () => {
		await load({ address: REDIRECT, storage: "cleared" });
		vi.mocked(track).mockClear();
		usePremiumStore.setState({ ...usePremiumStore.getInitialState(), needsSessionCheck: true });

		await usePremiumStore.getState().checkExistingSession();

		expect(reported()).toStrictEqual([]);
	});

	it("counts the donor once however the page is visited afterwards", async () => {
		await load({ address: REDIRECT, storage: "cleared" });
		await reload("kept");
		await reload("cleared");
		await reload("cleared");
		await reload("kept");

		expect(reported()).toStrictEqual([ACTIVATED]);
	});

	it("reports nothing for a donor this device already holds as Premium, redirect or not", async () => {
		usePremiumStore.setState({ premiumKey: "pk_earlier", userEmail: SESSION.email });

		await load({ address: REDIRECT, storage: "kept" });

		expect(reported()).toStrictEqual([]);
	});

	it("reports nothing when the cookie holds no session, even behind the marker", async () => {
		vi.mocked(getExistingSession).mockResolvedValue(null);

		await load({ address: REDIRECT, storage: "cleared" });

		expect(reported()).toStrictEqual([]);
		expect(usePremiumStore.getState().premiumKey).toBeNull();
	});
});
