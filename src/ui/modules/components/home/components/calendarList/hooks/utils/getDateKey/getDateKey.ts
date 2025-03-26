import { format } from "date-fns";

export function getDateKey(date: Date): string {
	return format(date, "yyyy-MM-dd");
}
