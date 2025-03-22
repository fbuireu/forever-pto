export function getDTODateKey(date: Date) {
	return date.toISOString().split("T")[0];
}
