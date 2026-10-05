import { describe, expect, it } from "vitest";
import { DEFAULT_STRATEGY, isStrategy, Strategy } from "./types";

describe("isStrategy", () => {
	it.each(Object.values(Strategy))("accepts %s", (strategy) => {
		expect(isStrategy(strategy)).toBe(true);
	});

	it.each([["GROUPED"], ["Grouped"], [""], ["optimised"], [null], [undefined], [0], [{}]])(
		"rejects %o, which a hand-edited persisted blob could carry",
		(value) => {
			expect(isStrategy(value)).toBe(false);
		},
	);

	it("accepts the default it is paired with", () => {
		expect(isStrategy(DEFAULT_STRATEGY)).toBe(true);
	});
});
