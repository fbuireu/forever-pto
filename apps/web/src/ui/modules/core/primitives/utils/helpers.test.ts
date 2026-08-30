import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import { describe, expect, it } from "vitest";
import { hasFlag } from "./helpers";

const COUNTRY: CountryDTO = { value: "ES", label: "Spain", flag: "🇪🇸" };
const REGION: RegionDTO = { value: "ct", label: "Catalonia" };

describe("hasFlag", () => {
	it("recognises a Country by the flag it carries", () => {
		expect(hasFlag(COUNTRY)).toBe(true);
	});

	it("does not recognise a Region, which has no flag", () => {
		expect(hasFlag(REGION)).toBe(false);
	});

	it("treats an empty flag as no flag, so nothing renders a blank slot", () => {
		expect(hasFlag({ ...COUNTRY, flag: "" })).toBe(false);
	});
});
