const FALLBACK_LOCALE = "en";
const FORMAT_SAMPLE = 11_111.1;
const MARKS = new Set([".", ","]);
const LEADING_GROUP = /^\d{1,3}$/;
const FULL_GROUP = /^\d{3}$/;
const DIGIT = /^\d$/;
const DIGITS_OR_NONE = /^\d*$/;
const NEGATIVE_SIGN = /^[-−]/u;
const ANY_SIGN = /^[-+−]/u;
const SPACE_SEPARATOR = /\p{Zs}/u;
const SPACE_SEPARATORS = /\p{Zs}/gu;
const NUMBER_CHARACTERS = /^[\d.,]+$/;
const NUMBER_CHARACTERS_WITH_SPACES = /^[\d., ]+$/;
const SPACE = " ";

interface Symbols {
	group: string;
	decimal: string;
}

const localesByRequest = new Map<string, string>();
const symbolsByLocale = new Map<string, Symbols>();

export const intlLocaleOf = (locale: string): string => {
	const known = localesByRequest.get(locale);
	if (known) return known;

	let resolved = FALLBACK_LOCALE;
	try {
		resolved = new Intl.NumberFormat(locale).resolvedOptions().locale;
	} catch {
		resolved = FALLBACK_LOCALE;
	}
	localesByRequest.set(locale, resolved);

	return resolved;
};

const symbolsOf = (locale: string): Symbols => {
	const known = symbolsByLocale.get(locale);
	if (known) return known;

	const parts = new Intl.NumberFormat(locale).formatToParts(FORMAT_SAMPLE);
	const symbols = {
		group: parts.find((part) => part.type === "group")?.value ?? "",
		decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
	};
	symbolsByLocale.set(locale, symbols);

	return symbols;
};

interface Split {
	integer: string;
	fraction: string;
}

interface SplitAtDecimalParams {
	body: string;
	symbols: Symbols;
}

const splitAtDecimal = ({ body, symbols }: SplitAtDecimalParams): Split | null => {
	const marks = [...body].flatMap((char, index) => (MARKS.has(char) ? [{ char, index }] : []));
	const last = marks.at(-1);
	if (!last) return { integer: body, fraction: "" };

	const before = body.slice(0, last.index);
	const after = body.slice(last.index + 1);
	const asDecimal = { integer: before, fraction: after };
	const asGroup = { integer: body, fraction: "" };
	const kinds = new Set(marks.map(({ char }) => char));
	const repeats = marks.filter(({ char }) => char === last.char).length > 1;

	if (kinds.size === 2) return repeats ? null : asDecimal;
	if (repeats) return asGroup;
	if (last.char === symbols.decimal) return asDecimal;

	const isGroup = last.char === symbols.group && FULL_GROUP.test(after) && LEADING_GROUP.test(before);

	return isGroup ? asGroup : asDecimal;
};

const digitsOfInteger = (integer: string): string | null => {
	const separators = new Set([...integer].filter((char) => !DIGIT.test(char)));
	if (separators.size === 0) return integer;
	if (separators.size > 1) return null;

	const [separator = ""] = separators;
	const [first = "", ...rest] = integer.split(separator);
	const isGrouped = LEADING_GROUP.test(first) && rest.every((segment) => FULL_GROUP.test(segment));

	return isGrouped ? [first, ...rest].join("") : null;
};

export interface ReadLocalizedNumberParams {
	text: string;
	locale: string;
}

export const readLocalizedNumber = ({ text, locale }: ReadLocalizedNumberParams): number | null => {
	const symbols = symbolsOf(intlLocaleOf(locale));
	const hasSpaceGroup = SPACE_SEPARATOR.test(symbols.group);
	const trimmed = text.trim();
	const unsigned = trimmed.replace(ANY_SIGN, "");
	const body = hasSpaceGroup ? unsigned.replace(SPACE_SEPARATORS, SPACE) : unsigned;
	if (!(hasSpaceGroup ? NUMBER_CHARACTERS_WITH_SPACES : NUMBER_CHARACTERS).test(body)) return null;

	const split = splitAtDecimal({ body, symbols });
	const integer = split ? digitsOfInteger(split.integer) : null;
	if (!split || integer === null || !DIGITS_OR_NONE.test(split.fraction)) return null;
	if (integer === "" && split.fraction === "") return null;

	const value = Number(`${integer || "0"}.${split.fraction || "0"}`);
	if (!Number.isFinite(value)) return null;

	return NEGATIVE_SIGN.test(trimmed) && value !== 0 ? -value : value;
};
