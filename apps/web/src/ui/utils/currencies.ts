import type { Locale } from "next-intl";

const CURRENCY_PART = "currency" as const;

export const DEFAULT_CURRENCY = "EUR";
export const DEFAULT_CURRENCY_SYMBOL = "€";

interface FormatterKey {
	locale: string;
	currency: string;
	fractionDigits?: number;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

const formatterFor = ({ locale, currency, fractionDigits }: FormatterKey): Intl.NumberFormat => {
	const key = `${locale}|${currency}|${fractionDigits ?? "auto"}`;
	const cached = formatterCache.get(key);

	if (cached) return cached;

	const formatter = new Intl.NumberFormat(locale, {
		style: CURRENCY_PART,
		currency,
		...(fractionDigits !== undefined && {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		}),
	});

	formatterCache.set(key, formatter);

	return formatter;
};

export const amountFormatter = (locale: Locale) =>
	formatterFor({ locale, currency: DEFAULT_CURRENCY, fractionDigits: 0 });
