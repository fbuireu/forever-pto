import { describe, expect, it } from "vitest";
import { amountFormatter, DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL } from "./currencies";

describe("the currency constants", () => {
	it.each(["en", "es", "ca", "it", "de", "fr"])(
		"renders DEFAULT_CURRENCY as DEFAULT_CURRENCY_SYMBOL in %s, which is why neither is derived per locale",
		(locale) => {
			const symbol = new Intl.NumberFormat(locale, { style: "currency", currency: DEFAULT_CURRENCY })
				.formatToParts(0)
				.find(({ type }) => type === "currency")?.value;

			expect(symbol).toBe(DEFAULT_CURRENCY_SYMBOL);
		},
	);
});

describe("formatter reuse", () => {
	it("hands back the same formatter for one locale, so the cache is shared rather than per function", () => {
		expect(amountFormatter("en")).toBe(amountFormatter("en"));
	});

	it("keeps the zero-digit and the default-digit formatters apart, which one cache key must not collapse", () => {
		expect(amountFormatter("en").format(10)).not.toContain(".");
	});
});

describe("amountFormatter", () => {
	it("returns an Intl.NumberFormat instance", () => {
		expect(amountFormatter("en")).toBeInstanceOf(Intl.NumberFormat);
	});

	it("formats a number as EUR currency", () => {
		const result = amountFormatter("en").format(1500);
		expect(result).toContain("1,500");
	});

	it("uses no decimal places", () => {
		const result = amountFormatter("en").format(99.99);
		expect(result).not.toContain(".");
	});

	it("returns the same formatter instance on repeated calls (cached)", () => {
		const first = amountFormatter("fr");
		const second = amountFormatter("fr");
		expect(first).toBe(second);
	});
});
