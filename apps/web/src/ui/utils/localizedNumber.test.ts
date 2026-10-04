import { describe, expect, it } from "vitest";
import { intlLocaleOf, readLocalizedNumber } from "./localizedNumber";

const read = (locale: string) => (text: string) => readLocalizedNumber({ text, locale });

describe("readLocalizedNumber in a language that groups with a comma and writes decimals with a point", () => {
	const en = read("en");

	it.each([
		["2.5", 2.5],
		["30,000", 30_000],
		["1,234.5", 1234.5],
		["1,234,567", 1_234_567],
		["10,000", 10_000],
		["1,000", 1000],
		["30.000", 30],
		["0.5", 0.5],
		[".5", 0.5],
		["5.", 5],
		["4.50", 4.5],
		["007", 7],
		["12", 12],
	])("reads %j as %d", (text, expected) => {
		expect(en(text)).toBe(expected);
	});

	it.each([
		["2,5", 2.5],
		["12,34", 12.34],
		["0,5", 0.5],
		["1,2345", 1.2345],
		["12345,67", 12_345.67],
		["1.234,5", 1234.5],
	])("reads %j, the other language's decimal comma, as %d", (text, expected) => {
		expect(en(text)).toBe(expected);
	});

	it.each([
		[""],
		[" "],
		["."],
		[","],
		[".,"],
		["abc"],
		["1e5"],
		["5-"],
		["1 000"],
		["1,2,3"],
		["1,234.5.6"],
		["1,5.5"],
	])("cannot read %j", (text) => {
		expect(en(text)).toBeNull();
	});

	it.each([
		["-5", -5],
		["+5", 5],
		["−5", -5],
		["-0", 0],
		["  7  ", 7],
	])("reads the sign and the padding of %j as %d", (text, expected) => {
		expect(en(text)).toBe(expected);
	});

	it("cannot read a number too large to hold", () => {
		expect(en("9".repeat(400))).toBeNull();
	});
});

describe.each(["es", "de", "it", "ca"])(
	"readLocalizedNumber in %s, which groups with a point and writes decimals with a comma",
	(locale) => {
		const read_ = read(locale);

		it.each([
			["2,5", 2.5],
			["30.000", 30_000],
			["1.234", 1234],
			["1.234,5", 1234.5],
			["1.234.567", 1_234_567],
			["10.000", 10_000],
			["1.000.000", 1_000_000],
			["1,000", 1],
			["0,5", 0.5],
			[",5", 0.5],
			["5,", 5],
			["12", 12],
		])("reads %j as %d", (text, expected) => {
			expect(read_(text)).toBe(expected);
		});

		it.each([
			["2.5", 2.5],
			["2.50", 2.5],
			["0.5", 0.5],
			["12.34", 12.34],
			["1.2345", 1.2345],
			["12345.67", 12_345.67],
			["1,234.5", 1234.5],
		])("reads %j, the other language's decimal point, as %d", (text, expected) => {
			expect(read_(text)).toBe(expected);
		});

		it.each([[""], ["."], [","], ["1.2.3"], ["1,2,3"], ["1.234,5,6"], ["1 000"], ["1.2,3"]])(
			"cannot read %j",
			(text) => {
				expect(read_(text)).toBeNull();
			},
		);
	},
);

describe("readLocalizedNumber in French, which groups with a narrow space", () => {
	const fr = read("fr");

	it.each([
		["2,5", 2.5],
		["2.5", 2.5],
		["30 000", 30_000],
		["30 000", 30_000],
		["30 000", 30_000],
		["1 234,5", 1234.5],
		["1 234 567", 1_234_567],
		["1.234", 1.234],
		["1,234", 1.234],
		["1 234.5", 1234.5],
	])("reads %j as %d", (text, expected) => {
		expect(fr(text)).toBe(expected);
	});

	it.each([["30 00"], ["1 2 3"], ["- 5"], ["1 234,5 6"], ["1 234.567.8"]])("cannot read %j", (text) => {
		expect(fr(text)).toBeNull();
	});
});

describe("intlLocaleOf", () => {
	it.each(["en", "es", "ca", "it", "de", "fr"])("keeps %s", (locale) => {
		expect(intlLocaleOf(locale)).toBe(locale);
	});

	it("falls back to English for a locale Intl cannot format, so a bad route cannot break a field", () => {
		expect(intlLocaleOf("not a locale")).toBe("en");
		expect(readLocalizedNumber({ text: "2.5", locale: "not a locale" })).toBe(2.5);
	});
});
