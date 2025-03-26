import { format } from "date-fns";
import { es } from "date-fns/locale";

export function getWeekday(date: Date) {
	return format(date, "EEEE", { locale: es });
}
