import { Temporal } from "temporal-polyfill";

const DAY_PREFIX_LENGTH = 10;

export type Stored<T> = T extends Date
	? string
	: T extends readonly (infer ITEM)[]
		? Stored<ITEM>[]
		: T extends object
			? { [KEY in keyof T]: Stored<T[KEY]> }
			: T;

export const fromUpstreamCalendarDay = (value: string): Date => {
	const plainDate = Temporal.PlainDate.from(value.slice(0, DAY_PREFIX_LENGTH));
	return new Date(plainDate.year, plainDate.month - 1, plainDate.day);
};

export const fromStoredInstant = (value: string): Date => new Date(value);
