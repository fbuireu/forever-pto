import { describe, expect, it } from "vitest";
import { getRegionName } from "./helpers";

const REGIONS = [
	{ value: "CAT", label: "Catalonia" },
	{ value: "MAD", label: "Madrid" },
];

describe("getRegionName", () => {
	it("returns the label for a matching region code (exact case)", () => {
		expect(getRegionName({ regionCode: "CAT", regions: REGIONS })).toBe("Catalonia");
	});

	it("is case-insensitive", () => {
		expect(getRegionName({ regionCode: "cat", regions: REGIONS })).toBe("Catalonia");
		expect(getRegionName({ regionCode: "Cat", regions: REGIONS })).toBe("Catalonia");
	});

	it("falls back to the original code when no region matches", () => {
		expect(getRegionName({ regionCode: "UNKNOWN", regions: REGIONS })).toBe("UNKNOWN");
	});

	it("returns empty string for an empty regionCode", () => {
		expect(getRegionName({ regionCode: "", regions: REGIONS })).toBe("");
	});

	it("falls back to code when regions array is empty", () => {
		expect(getRegionName({ regionCode: "CAT", regions: [] })).toBe("CAT");
	});
});
