interface ResolveSelectedDaysParams {
  days: Date[];
  manuallySelectedDays?: Date[];
  removedSuggestedDays?: Date[];
}

export function resolveSelectedDays({
  days,
  manuallySelectedDays = [],
  removedSuggestedDays = [],
}: ResolveSelectedDaysParams) {
  if (manuallySelectedDays.length === 0 && removedSuggestedDays.length === 0) return days;

  const removed = new Set(removedSuggestedDays.map((day) => day.toDateString()));
  const kept = days.filter((day) => !removed.has(day.toDateString()));

  return [...kept, ...manuallySelectedDays].toSorted((a, b) => a.getTime() - b.getTime());
}
