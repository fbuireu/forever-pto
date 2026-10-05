import { describe, expect, it } from "vitest";
import { regionDTO } from "./dto";

describe("regionDTO", () => {
	it("returns an empty array for an empty raw object", () => {
		expect(regionDTO.create({})).toEqual([]);
	});

	it("maps a single entry to a RegionDTO with value and label only", () => {
		const result = regionDTO.create({ CA: "Catalonia" });

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({ value: "CA", label: "Catalonia" });
		expect(result[0]).not.toHaveProperty("flag");
	});

	it("maps all entries preserving their codes as value", () => {
		const result = regionDTO.create({ CA: "Catalonia", MAD: "Madrid", VAL: "Valencia" });

		expect(result).toEqual([
			{ value: "CA", label: "Catalonia" },
			{ value: "MAD", label: "Madrid" },
			{ value: "VAL", label: "Valencia" },
		]);
	});
});
