export function getDateKey(date: Date) {
	return date.toISOString().split("T")[0];
}
