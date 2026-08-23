import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { renderHook } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { amountFormatter, DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL, useCurrencyFormatter } from "./currencies";

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

describe("useCurrencyFormatter", () => {
	const NON_BREAKING_SPACES = /[  ]/g;

	interface FormatChargeParams {
		locale: Locale;
		value: number;
	}

	const formatCharge = ({ locale, value }: FormatChargeParams) => {
		const { result } = renderHook(() => useCurrencyFormatter(), {
			wrapper: ({ children }: { children: ReactNode }) =>
				createElement(NextIntlClientProvider, { locale, messages: {}, children }),
		});

		return result.current(value).replace(NON_BREAKING_SPACES, " ");
	};

	it("leads with the symbol and separates the cents with a point in English", () => {
		expect(formatCharge({ locale: "en", value: 3.5 })).toBe("€3.50");
	});

	it("trails the symbol and separates the cents with a comma in German, which a baked-in € cannot do", () => {
		expect(formatCharge({ locale: "de", value: 3.5 })).toBe("3,50 €");
	});

	it("trails the symbol in French too, so five of the six locales disagree with a leading one", () => {
		expect(formatCharge({ locale: "fr", value: 3.5 })).toBe("3,50 €");
	});

	it("always shows the cents, because this is an amount about to be taken", () => {
		expect(formatCharge({ locale: "en", value: 10 })).toBe("€10.00");
	});
});

describe("the catalogue writes no currency symbol", () => {
	const bundles = {
		en: enMessages,
		es: esMessages,
		ca: caMessages,
		it: itMessages,
		de: deMessages,
		fr: frMessages,
	};

	interface CollectParams {
		value: unknown;
		path: string;
		out: string[];
	}

	const collect = ({ value, path, out }: CollectParams) => {
		if (typeof value === "string") {
			if (value.includes(DEFAULT_CURRENCY_SYMBOL)) out.push(`${path} -> ${value}`);
		} else if (value && typeof value === "object")
			for (const [key, child] of Object.entries(value))
				collect({ value: child, path: path ? `${path}.${key}` : key, out });
		return out;
	};

	it.each(Object.entries(bundles))(
		"places no %s message's symbol for it, because only the locale knows which side it goes on",
		(_locale, messages) => {
			expect(collect({ value: messages, path: "", out: [] })).toEqual([]);
		},
	);
});
