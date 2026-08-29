import type { RawHoliday } from "@application/dto/holiday/types";

interface ResolveObservedParams {
	national: RawHoliday[];
	regional: RawHoliday[];
	hasRegion: boolean;
}

export function resolveObservedHolidays({ national, regional, hasRegion }: ResolveObservedParams): RawHoliday[] {
	if (!hasRegion) return national;

	const observedDates = new Set(regional.map(({ date }) => date));

	return [...national.filter(({ date }) => observedDates.has(date)), ...regional];
}
