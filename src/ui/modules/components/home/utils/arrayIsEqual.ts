import { format } from "date-fns";

export function areArraysEqual(arr1: Date[], arr2: Date[]): boolean {
	if (arr1.length !== arr2.length) return false;

	const set = new Set<string>();

	for (const date of arr1) {
		set.add(format(date, "yyyy-MM-dd"));
	}

	return arr2.every((date) => set.has(format(date, "yyyy-MM-dd")));
}
