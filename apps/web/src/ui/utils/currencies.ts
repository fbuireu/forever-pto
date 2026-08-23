import type { Locale } from "next-intl";

const CURRENCY_PART = "currency" as const;

export const DEFAULT_CURRENCY = "EUR";
export const DEFAULT_CURRENCY_SYMBOL = "€";

const formatterCache = new Map<string, Intl.NumberFormat>();

export const amountFormatter = (locale: Locale): Intl.NumberFormat => {
	const cached = formatterCache.get(locale);

	if (cached) return cached;

	const formatter = new Intl.NumberFormat(locale, {
		style: CURRENCY_PART,
		currency: DEFAULT_CURRENCY,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});

	formatterCache.set(locale, formatter);

	return formatter;
};
