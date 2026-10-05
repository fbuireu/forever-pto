import { ES } from "@infrastructure/i18n/locales";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));
const { mockGetStates, MockHolidays } = vi.hoisted(() => {
	const mockGetStates = vi.fn();
	// biome-ignore lint/complexity/useArrowFunction: called with `new`; arrow fn doesn't return the instance correctly
	const MockHolidays = vi.fn().mockImplementation(function () {
		return { getStates: mockGetStates };
	});
	return { mockGetStates, MockHolidays };
});

vi.mock("@infrastructure/logging/logger", () => ({
	logger: { logError: mockLogError },
}));

vi.mock("date-holidays", () => ({ default: MockHolidays }));

const { getRegions } = await import("./getRegions");

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getRegions", () => {
	it("returns empty array when no countryCode is provided", () => {
		expect(getRegions()).toEqual([]);
		expect(MockHolidays).not.toHaveBeenCalled();
	});

	it("returns empty array when getStates returns null", () => {
		mockGetStates.mockReturnValue(null);

		expect(getRegions({ countryCode: ES })).toEqual([]);
	});

	it("returns empty array when getStates returns an empty object", () => {
		mockGetStates.mockReturnValue({});

		expect(getRegions({ countryCode: ES })).toEqual([]);
	});

	it("passes countryCode to Holidays constructor", () => {
		mockGetStates.mockReturnValue({ CAT: "Catalonia" });

		getRegions({ countryCode: "ES" });

		expect(MockHolidays).toHaveBeenCalledWith("ES");
	});

	it("calls getStates with lowercased countryCode", () => {
		mockGetStates.mockReturnValue({ CAT: "Catalonia" });

		getRegions({ countryCode: "ES" });

		expect(mockGetStates).toHaveBeenCalledWith("es");
	});

	it("offers each region the source holds as a value, its code, and a label, its name", () => {
		mockGetStates.mockReturnValue({ CAT: "Catalonia", MAD: "Madrid" });

		expect(getRegions({ countryCode: ES })).toEqual([
			{ value: "CAT", label: "Catalonia" },
			{ value: "MAD", label: "Madrid" },
		]);
	});

	it("returns regions sorted alphabetically by label", () => {
		mockGetStates.mockReturnValue({ MAD: "Madrid", CAT: "Catalonia", AND: "Andalucia" });

		const result = getRegions({ countryCode: ES });

		expect(result.map(({ label }) => label)).toEqual(["Andalucia", "Catalonia", "Madrid"]);
	});

	it("returns empty array and logs error when an exception is thrown", () => {
		mockGetStates.mockImplementation(() => {
			throw new Error("holidays failure");
		});

		const result = getRegions({ countryCode: ES });

		expect(result).toEqual([]);
		expect(mockLogError).toHaveBeenCalledWith({
			message: "Error in getRegions",
			error: expect.any(Error),
			context: { countryCode: ES },
		});
	});
});
