import { format } from "date-fns";

interface ArrayIsEqualParams {
	arr1: Date[];
	arr2: Date[];
}

export function areArraysEqual({ arr1, arr2 }: ArrayIsEqualParams): boolean {
	if (arr1.length !== arr2.length) return false;

	const set = new Set<string>();

	for (const date of arr1) {
		set.add(format(date, "yyyy-MM-dd"));
	}

	return arr2.every((date) => set.has(format(date, "yyyy-MM-dd")));
}
