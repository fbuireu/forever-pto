import type { Locale } from "next-intl";
import { useFormatter } from "next-intl";
import { useCallback } from "react";

const CURRENCY_PART = "currency" as const;
const CHARGE_FRACTION_DIGITS = 2;

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

export const useCurrencyFormatter = () => {
	const format = useFormatter();

	return useCallback(
		(value: number) =>
			format.number(value, {
				style: CURRENCY_PART,
				currency: DEFAULT_CURRENCY,
				minimumFractionDigits: CHARGE_FRACTION_DIGITS,
			}),
		[format],
	);
};
