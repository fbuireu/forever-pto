import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CountryDTO } from "@application/dto/country/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocationStore } from "./location";

const { mockLogError, mockWarn } = vi.hoisted(() => ({ mockLogError: vi.fn(), mockWarn: vi.fn() }));

vi.mock("@infrastructure/logging/logger", () => ({
	logger: { logError: mockLogError, warn: mockWarn },
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

const MOCK_COUNTRIES: CountryDTO[] = [
	{ value: "ES", label: "Spain", flag: "es" },
	{ value: "FR", label: "France", flag: "fr" },
];

beforeEach(() => {
	useLocationStore.setState(useLocationStore.getInitialState());
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
	it("sets the regions getRegions answers", async () => {
		const { getRegions } = await import("@infrastructure/services/regions/getRegions");
		const MOCK_REGIONS = [{ value: "CAT", label: "Catalonia" }];
		vi.mocked(getRegions).mockReturnValueOnce(MOCK_REGIONS);

		await useLocationStore.getState().fetchRegions("ES");
		expect(getRegions).toHaveBeenCalledWith({ countryCode: "ES" });
		expect(useLocationStore.getState().regions).toEqual(MOCK_REGIONS);
	});

	it("clears the previous regions when a country has none", async () => {
		const { getRegions } = await import("@infrastructure/services/regions/getRegions");
		useLocationStore.setState({ regions: [{ value: "CAT", label: "Catalonia" }] });
		vi.mocked(getRegions).mockReturnValueOnce([]);

		await useLocationStore.getState().fetchRegions("FR");
		expect(useLocationStore.getState().regions).toEqual([]);
	});

	it("does not load the holiday dataset until regions are asked for", () => {
		const source = readFileSync(resolve(process.cwd(), "src/application/stores/location.ts"), "utf8");

		expect(source).not.toMatch(/^import .*getRegions/m);
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
			expect(mockLogError).toHaveBeenCalledWith({
				message: "Error rehydrating location-store",
				error: expect.any(Error),
				context: {
					storeName: "location-store",
					hasState: true,
				},
			}),
		);
	});

	it("logs nothing when rehydration succeeds", async () => {
		runRehydrate();

		await Promise.resolve();
		expect(mockLogError).not.toHaveBeenCalled();
	});
});
