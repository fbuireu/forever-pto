import { CA, DE, EN, ES, FR, IT } from "@infrastructure/i18n/locales";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));
const { mockGetNames, mockRegisterLocale } = vi.hoisted(() => ({
	mockGetNames: vi.fn(),
	mockRegisterLocale: vi.fn(),
}));

vi.mock("@infrastructure/logging/logger", () => ({
	logger: { logError: mockLogError },
}));

vi.mock("i18n-iso-countries", () => ({
	default: { registerLocale: mockRegisterLocale, getNames: mockGetNames },
}));

vi.mock("i18n-iso-countries/langs/ca.json", () => ({ default: { locale: "ca" as const } }));
vi.mock("i18n-iso-countries/langs/de.json", () => ({ default: { locale: "de" as const } }));
vi.mock("i18n-iso-countries/langs/en.json", () => ({ default: { locale: "en" as const } }));
vi.mock("i18n-iso-countries/langs/es.json", () => ({ default: { locale: "es" as const } }));
vi.mock("i18n-iso-countries/langs/fr.json", () => ({ default: { locale: "fr" as const } }));
vi.mock("i18n-iso-countries/langs/it.json", () => ({ default: { locale: "it" as const } }));

const { getCountries } = await import("./getCountries");
const registeredAtLoad = [...mockRegisterLocale.mock.calls];

beforeEach(() => {
	mockGetNames.mockReset();
	mockLogError.mockReset();
});

describe("locale registration", () => {
	it("registers all 6 locales at module load", () => {
		expect(registeredAtLoad).toHaveLength(6);
	});

	it("registers ca, de, en, es, fr and it locales", () => {
		const registeredLocales = registeredAtLoad.map((call) => (call[0] as { locale: string }).locale);
		expect(registeredLocales).toEqual(expect.arrayContaining([CA, DE, EN, ES, FR, IT]));
	});
});

describe("getCountries", () => {
	it("returns country DTOs sorted alphabetically by label", () => {
		mockGetNames.mockReturnValue({ US: "United States", ES: "Spain", FR: "France" });

		const result = getCountries(EN);

		expect(mockGetNames).toHaveBeenCalledWith(EN);
		expect(result).toEqual([
			{ value: "FR", label: "France", flag: "fr" },
			{ value: "ES", label: "Spain", flag: "es" },
			{ value: "US", label: "United States", flag: "us" },
		]);
	});

	it("returns empty array and logs error when getNames throws", () => {
		mockGetNames.mockImplementation(() => {
			throw new Error("unsupported locale");
		});

		const result = getCountries("ca");

		expect(result).toEqual([]);
		expect(mockLogError).toHaveBeenCalledWith({
			message: "Error in getCountries",
			error: expect.any(Error),
			context: { locale: "ca" },
		});
	});

	it("returns empty array and logs error when the library hands back no names to turn into countries", () => {
		mockGetNames.mockReturnValue(undefined);

		const result = getCountries("en");

		expect(result).toEqual([]);
		expect(mockLogError).toHaveBeenCalledWith({
			message: "Error in getCountries",
			error: expect.any(Error),
			context: { locale: "en" as const },
		});
	});
});
