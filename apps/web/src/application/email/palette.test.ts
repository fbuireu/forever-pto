import { describe, expect, it } from "vitest";
import { EMAIL_PALETTE } from "./palette";

interface ColourTree {
	readonly [name: string]: string | ColourTree;
}

const SIX_DIGIT_HEX = /^#[0-9a-f]{6}$/i;

const flattened = (tree: ColourTree): string[] =>
	Object.values(tree).flatMap((entry) => (typeof entry === "string" ? [entry] : flattened(entry)));

describe("the email palette", () => {
	it("writes each colour as the six-digit hex react-email converts to the rgb a mail client reads", () => {
		const colours = flattened(EMAIL_PALETTE);

		expect(colours.length).toBeGreaterThan(15);
		expect(colours.filter((colour) => !SIX_DIGIT_HEX.test(colour))).toEqual([]);
	});

	it("keeps the theme keys the template's classes name", () => {
		expect(Object.keys(EMAIL_PALETTE)).toEqual(["brand", "email"]);
		expect(Object.keys(EMAIL_PALETTE.brand)).toEqual(["yellow", "teal", "orange", "purple"]);
		expect(Object.keys(EMAIL_PALETTE.email)).toEqual([
			"page",
			"wash",
			"card",
			"well",
			"line",
			"ink",
			"body",
			"strong",
			"label",
			"muted",
			"faint",
			"inverse",
		]);
	});
});
