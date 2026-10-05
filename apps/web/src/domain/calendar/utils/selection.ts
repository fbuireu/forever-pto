interface ResolveSelectedDaysParams {
	days: Date[];
	manualDays?: Date[];
	removedSuggestedDays?: Date[];
}

export function resolveSelectedDays({ days, manualDays = [], removedSuggestedDays = [] }: ResolveSelectedDaysParams) {
	if (manualDays.length === 0 && removedSuggestedDays.length === 0) return days;

	const removed = new Set(removedSuggestedDays.map((day) => day.toDateString()));
	const kept = days.filter((day) => !removed.has(day.toDateString()));

	return [...kept, ...manualDays].toSorted((a, b) => a.getTime() - b.getTime());
}
