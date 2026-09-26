import { describe, expect, it } from "vitest";
import {
	DEFAULT_FILTER_STRATEGY,
	DEFAULT_PREFERRED_MONTHS,
	FilterStrategy,
	isFilterStrategy,
	isPreferredMonths,
} from "./types";

describe("isFilterStrategy", () => {
	it.each(Object.values(FilterStrategy))("accepts %s", (strategy) => {
		expect(isFilterStrategy(strategy)).toBe(true);
	});

	it.each([["GROUPED"], ["Grouped"], [""], ["optimised"], [null], [undefined], [0], [{}]])(
		"rejects %o, which a hand-edited persisted blob could carry",
		(value) => {
			expect(isFilterStrategy(value)).toBe(false);
		},
	);

	it("accepts the default it is paired with", () => {
		expect(isFilterStrategy(DEFAULT_FILTER_STRATEGY)).toBe(true);
	});
});

describe("isPreferredMonths", () => {
	it.each([[[]], [[0]], [[6, 7]], [[0, 11]]])("accepts %o", (value) => {
		expect(isPreferredMonths(value)).toBe(true);
	});

	it.each([[[12]], [[-1]], [[6, 6]], [[1.5]], [["6"]], ["6,7"], [null], [undefined], [{}]])(
		"rejects %o, which a hand-edited persisted blob or a stale worker message could carry",
		(value) => {
			expect(isPreferredMonths(value)).toBe(false);
		},
	);

	it("accepts the default it is paired with", () => {
		expect(isPreferredMonths([...DEFAULT_PREFERRED_MONTHS])).toBe(true);
	});
});
