import type { CountryDTO } from "@application/dto/country/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocationStore } from "./location";

const { mockLogError, mockWarn } = vi.hoisted(() => ({ mockLogError: vi.fn(), mockWarn: vi.fn() }));

vi.mock("@infrastructure/clients/logging/better-stack/client", () => ({
	getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError, warn: mockWarn }),
}));

vi.mock("./crypto", () => ({
	obfuscatedStorage: {
		getItem: vi.fn().mockResolvedValue(null),
		setItem: vi.fn().mockResolvedValue(undefined),
		removeItem: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock("@infrastructure/services/regions/getRegions", () => ({
	getRegions: vi.fn().mockReturnValue([]),
}));

const INITIAL = {
	countries: [],
	regions: [],
};

const MOCK_COUNTRIES: CountryDTO[] = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
];

beforeEach(() => {
	useLocationStore.setState(INITIAL);
	vi.clearAllMocks();
});

describe("setCountries", () => {
	it("stores the countries it is given", () => {
		useLocationStore.getState().setCountries(MOCK_COUNTRIES);
		expect(useLocationStore.getState().countries).toEqual(MOCK_COUNTRIES);
	});

	it("replaces a previous list rather than merging it", () => {
		useLocationStore.getState().setCountries(MOCK_COUNTRIES);
		useLocationStore.getState().setCountries([MOCK_COUNTRIES[0]]);
		expect(useLocationStore.getState().countries).toEqual([MOCK_COUNTRIES[0]]);
	});

	it("accepts an empty list", () => {
		useLocationStore.getState().setCountries(MOCK_COUNTRIES);
		useLocationStore.getState().setCountries([]);
		expect(useLocationStore.getState().countries).toEqual([]);
	});
});

describe("fetchRegions", () => {
	it("sets regions from getRegions synchronously", async () => {
		const { getRegions } = await import("@infrastructure/services/regions/getRegions");
		const MOCK_REGIONS = [{ value: "CAT", label: "Catalonia" }];
		vi.mocked(getRegions).mockReturnValueOnce(MOCK_REGIONS);

		useLocationStore.getState().fetchRegions("ES");
		expect(getRegions).toHaveBeenCalledWith("ES");
		expect(useLocationStore.getState().regions).toEqual(MOCK_REGIONS);
	});

	it("clears the previous regions when a country has none", async () => {
		const { getRegions } = await import("@infrastructure/services/regions/getRegions");
		useLocationStore.setState({ regions: [{ value: "CAT", label: "Catalonia" }] });
		vi.mocked(getRegions).mockReturnValueOnce([]);

		useLocationStore.getState().fetchRegions("FR");
		expect(useLocationStore.getState().regions).toEqual([]);
	});
});

describe("persistence", () => {
	it("persists nothing, because both lists are rebuilt on mount", () => {
		useLocationStore.setState({ countries: MOCK_COUNTRIES, regions: [{ value: "CAT", label: "Catalonia" }] });
		const { partialize } = useLocationStore.persist.getOptions();
		expect(partialize?.(useLocationStore.getState())).toEqual({});
	});

	it("drops an older blob instead of reviving the lists it carries", () => {
		const { migrate } = useLocationStore.persist.getOptions();
		expect(migrate?.({ countries: MOCK_COUNTRIES, regions: [{ value: "CAT", label: "Catalonia" }] }, 2)).toEqual({});
	});
});

describe("onRehydrateStorage", () => {
	const runRehydrate = (error?: Error) => {
		const options = useLocationStore.persist.getOptions();
		const listener = options.onRehydrateStorage?.(useLocationStore.getState() as never);
		listener?.(useLocationStore.getState() as never, error);
	};

	it("logs a rehydration failure without blocking the listener on the logging client", async () => {
		runRehydrate(new Error("deobfuscate failed"));

		expect(mockLogError).not.toHaveBeenCalled();
		await vi.waitFor(() =>
			expect(mockLogError).toHaveBeenCalledWith("Error rehydrating location-store", expect.any(Error), {
				storeName: "location-store",
				hasState: true,
			}),
		);
	});

	it("logs nothing when rehydration succeeds", async () => {
		runRehydrate();

		await Promise.resolve();
		expect(mockLogError).not.toHaveBeenCalled();
	});
});
