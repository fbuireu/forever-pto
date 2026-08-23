import type { Locale } from "next-intl";

interface LabelledOption {
	label: string;
}

const collators = new Map<string, Intl.Collator>();

const collatorFor = (locale?: Locale) => {
	const key = locale ?? "";
	const cached = collators.get(key);
	if (cached) return cached;

	const collator = new Intl.Collator(locale);
	collators.set(key, collator);
	return collator;
};

export interface CollateByLabelParams<T extends LabelledOption> {
	options: T[];
	locale?: Locale;
}

export const collateByLabel = <T extends LabelledOption>({ options, locale }: CollateByLabelParams<T>): T[] => {
	const collator = collatorFor(locale);
	return options.toSorted((a, b) => collator.compare(a.label, b.label));
};
