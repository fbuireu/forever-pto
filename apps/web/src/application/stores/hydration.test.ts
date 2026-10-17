import { afterEach, describe, expect, it, vi } from "vitest";
import { obfuscate } from "./utils/crypto";

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));

vi.mock("@infrastructure/logging/logger", () => ({
	logger: { logError: mockLogError, warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

interface PersistedStore {
	persist: { hasHydrated: () => boolean };
}

interface StoreUnderTest {
	key: string;
	load: () => Promise<PersistedStore>;
}

const UNREADABLE = "{not json";

const STORES: StoreUnderTest[] = [
	{ key: "filters-store", load: async () => (await import("./filters")).useFiltersStore },
	{ key: "holidays-store", load: async () => (await import("./holidays")).useHolidaysStore },
	{ key: "location-store", load: async () => (await import("./location")).useLocationStore },
	{ key: "premium-store", load: async () => (await import("./premium")).usePremiumStore },
];

afterEach(() => {
	localStorage.clear();
	vi.unstubAllEnvs();
	vi.clearAllMocks();
});

describe("a persisted store whose stored state cannot be read", () => {
	it.each(STORES)(
		"$key still ends hydrated, on its defaults, with the blob removed and the failure logged",
		async ({ key, load }) => {
			localStorage.setItem(key, UNREADABLE);
			vi.resetModules();

			const store = await load();

			expect(store.persist.hasHydrated()).toBe(true);
			expect(localStorage.getItem(key)).toBeNull();
			await vi.waitFor(() =>
				expect(mockLogError).toHaveBeenCalledWith(expect.objectContaining({ message: `Error rehydrating ${key}` })),
			);
		},
	);

	it("starts Premium over with a session check after the storage key changes, so the cookie restores it", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("NEXT_PUBLIC_STORAGE_KEY", "new-key");
		const written = JSON.stringify({
			state: {
				premiumKey: "pi_paid",
				userEmail: "donor@example.com",
				lastVerified: Date.now(),
				needsSessionCheck: false,
			},
			version: 1,
		});
		localStorage.setItem("premium-store", obfuscate({ text: written, key: "old-key" }));
		vi.resetModules();

		const { usePremiumStore } = await import("./premium");

		expect(usePremiumStore.persist.hasHydrated()).toBe(true);
		expect(usePremiumStore.getState()).toMatchObject({ premiumKey: null, userEmail: null, needsSessionCheck: true });
		expect(localStorage.getItem("premium-store")).toBeNull();
	});
});
