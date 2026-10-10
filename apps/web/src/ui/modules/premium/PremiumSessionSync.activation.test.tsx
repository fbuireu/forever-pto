import { ACTIVATION_COOKIE, ACTIVATION_PARAM } from "@application/dto/payment/types";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { track, getExistingSession } = vi.hoisted(() => ({
	track: vi.fn(),
	getExistingSession: vi.fn(),
}));

vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));
vi.mock("@infrastructure/logging/logger", () => ({ logger: { logError: vi.fn(), warn: vi.fn() } }));
vi.mock("@ui/adapters/session/checkSession", async (importOriginal) => ({
	...(await importOriginal<typeof import("@ui/adapters/session/checkSession")>()),
	getExistingSession,
}));

const SESSION = { premiumKey: "pk_redirect", email: "donor@example.com" };
const ACTIVATED = { event: "premium_activated", properties: { plan: "premium" } };
const CONFIRMATION = "/payment/confirmation?payment_intent=pi_probe";
const LANDING = CONFIRMATION;
const STALE_MARKER = `${CONFIRMATION}&${ACTIVATION_PARAM}=fresh`;

type Storage = "kept" | "cleared";

interface OpenParams {
	address: string;
	storage: Storage;
}

const reported = () => track.mock.calls.map(([params]) => params);

const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const setCookie = (cookie: string) => {
	// biome-ignore lint/suspicious/noDocumentCookie: the test plays the browser that receives the activation route's Set-Cookie
	document.cookie = cookie;
};

const hasProof = () => document.cookie.split("; ").some((row) => row.startsWith(`${ACTIVATION_COOKIE}=`));

const landFromTheIssuer = () => {
	setCookie(`${ACTIVATION_COOKIE}=1; path=/`);
	return LANDING;
};

const open = async ({ address, storage }: OpenParams) => {
	window.history.replaceState(null, "", address);
	if (storage === "cleared") localStorage.clear();
	vi.resetModules();
	const [{ PremiumSessionSync }, { usePremiumStore }] = await Promise.all([
		import("./PremiumSessionSync"),
		import("@application/stores/premium"),
	]);
	const page = render(<PremiumSessionSync />);

	return { page, usePremiumStore };
};

const visit = async ({ address, storage }: OpenParams) => {
	const { page, usePremiumStore } = await open({ address, storage });
	await settled();
	page.unmount();

	return usePremiumStore.getState();
};

const leaveBeforeTheCallSettles = async ({ address, storage }: OpenParams) => {
	getExistingSession.mockReturnValueOnce(new Promise(() => {}));
	const { page } = await open({ address, storage });
	const entry = window.location.href;
	page.unmount();

	return entry;
};

beforeEach(() => {
	track.mockReset();
	getExistingSession.mockReset();
	getExistingSession.mockResolvedValue(SESSION);
	localStorage.clear();
});

afterEach(() => {
	setCookie(`${ACTIVATION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
	localStorage.clear();
	window.history.replaceState(null, "", "/");
});

describe("which loads of the payment confirmation page report premium_activated", () => {
	it("reports the activation the redirect lands on, once", async () => {
		const state = await visit({ address: landFromTheIssuer(), storage: "cleared" });

		expect(reported()).toStrictEqual([ACTIVATED]);
		expect(state.premiumKey).toBe(SESSION.premiumKey);
	});

	it("reports it once when the page is reloaded while the confirmation is still on its way", async () => {
		const entry = await leaveBeforeTheCallSettles({ address: landFromTheIssuer(), storage: "cleared" });

		await visit({ address: entry, storage: "kept" });

		expect(reported()).toStrictEqual([ACTIVATED]);
	});

	it("reports nothing more when the page is reloaded after the confirmation settled", async () => {
		await visit({ address: landFromTheIssuer(), storage: "cleared" });

		await visit({ address: window.location.href, storage: "kept" });

		expect(reported()).toStrictEqual([ACTIVATED]);
	});

	it("reports it once when the payer leaves for another page of the app before it settles and comes back through the history", async () => {
		const session = Promise.withResolvers<typeof SESSION>();
		getExistingSession.mockReturnValueOnce(session.promise);
		const { page } = await open({ address: landFromTheIssuer(), storage: "cleared" });
		const entry = window.location.href;
		page.unmount();
		window.history.pushState(null, "", "/planner");
		session.resolve(SESSION);
		await settled();

		await visit({ address: entry, storage: "cleared" });

		expect(reported()).toStrictEqual([ACTIVATED]);
	});

	it("reports it once when the page dies before the confirmation settles and the payer comes back through the history", async () => {
		const entry = await leaveBeforeTheCallSettles({ address: landFromTheIssuer(), storage: "cleared" });

		await visit({ address: entry, storage: "kept" });
		await visit({ address: entry, storage: "kept" });

		expect(reported()).toStrictEqual([ACTIVATED]);
	});

	it("reports nothing on a revisit, whatever the address", async () => {
		await visit({ address: landFromTheIssuer(), storage: "cleared" });

		await visit({ address: CONFIRMATION, storage: "kept" });
		await visit({ address: STALE_MARKER, storage: "kept" });

		expect(reported()).toStrictEqual([ACTIVATED]);
	});

	it("reports nothing when the payer returns with local storage cleared, to any address the visit went through", async () => {
		await visit({ address: landFromTheIssuer(), storage: "cleared" });

		await visit({ address: STALE_MARKER, storage: "cleared" });
		await visit({ address: CONFIRMATION, storage: "cleared" });

		expect(reported()).toStrictEqual([ACTIVATED]);
	});

	it("reports nothing on a load the redirect did not land on, which only restores what the cookie holds", async () => {
		const state = await visit({ address: CONFIRMATION, storage: "cleared" });

		expect(reported()).toStrictEqual([]);
		expect(state.premiumKey).toBe(SESSION.premiumKey);
	});

	it("reports nothing for a donor this device already holds as Premium, and spends the proof", async () => {
		await visit({ address: CONFIRMATION, storage: "cleared" });

		await visit({ address: landFromTheIssuer(), storage: "kept" });
		await visit({ address: STALE_MARKER, storage: "cleared" });

		expect(reported()).toStrictEqual([]);
	});

	it("keeps the proof while the session cookie holds no session, so a later load can still report it", async () => {
		getExistingSession.mockResolvedValueOnce(null);

		const state = await visit({ address: landFromTheIssuer(), storage: "cleared" });
		await visit({ address: CONFIRMATION, storage: "kept" });

		expect(state.premiumKey).toBeNull();
		expect(reported()).toStrictEqual([ACTIVATED]);
		expect(hasProof()).toBe(false);
	});
});
