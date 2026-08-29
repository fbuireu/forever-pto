import { describe, expect, it } from "vitest";
import { collateByLabel } from "./collate";

const options = [{ label: "ñandú" }, { label: "nutria" }];

describe("collateByLabel", () => {
	it("orders by the locale it is given, not by the runtime default", () => {
		expect(collateByLabel({ options, locale: "es" }).map(({ label }) => label)).toEqual(["nutria", "ñandú"]);
		expect(collateByLabel({ options, locale: "en" }).map(({ label }) => label)).toEqual(["ñandú", "nutria"]);
	});

	it("falls back to the runtime default when no locale is available", () => {
		expect(collateByLabel({ options }).map(({ label }) => label)).toHaveLength(2);
	});

	it("leaves the caller its array", () => {
		const input = [{ label: "b" }, { label: "a" }];
		collateByLabel({ options: input, locale: "en" });
		expect(input.map(({ label }) => label)).toEqual(["b", "a"]);
	});

	it("carries every field through, not just the label", () => {
		const withValue = [
			{ value: "NU", label: "nutria" },
			{ value: "NA", label: "ñandú" },
		];
		expect(collateByLabel({ options: withValue, locale: "es" })).toEqual([
			{ value: "NU", label: "nutria" },
			{ value: "NA", label: "ñandú" },
		]);
	});
});
