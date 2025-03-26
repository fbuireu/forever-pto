import { parseISO } from "date-fns";

export function getDateFromKey(key: string): Date {
	return parseISO(key);
}
