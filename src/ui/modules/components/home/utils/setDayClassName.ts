import { isSameDay, isSameMonth, isToday, isWeekend } from "date-fns";

interface SetDayClassNameParams {
	date: Date;
	displayMonth: Date;
	selectedDays: Date[];
	isHoliday: (date: Date) => boolean;
	isDaySuggested: (date: Date) => boolean;
	isDayAlternative: (date: Date) => boolean;
	isPastDayAllowed: () => boolean;
}

export function setDayClassName({
	date,
	displayMonth,
	selectedDays,
	isHoliday,
	isDaySuggested,
	isDayAlternative,
	isPastDayAllowed,
}: SetDayClassNameParams): string {
	const BASE_CLASSES = [
		"h-8 w-8 p-0",
		"inline-flex items-center justify-center",
		"rounded-sm text-sm font-medium",
		"transition-colors focus-visible:outline-hidden",
		"aria-selected:opacity-100",
	];

	if (!isSameMonth(date, displayMonth)) {
		BASE_CLASSES.push("opacity-0 invisible");
		return BASE_CLASSES.join(" ");
	}

	if (!isPastDayAllowed() && date < new Date() && !selectedDays.some((d) => isSameDay(d, date))) {
		BASE_CLASSES.push("text-muted-foreground opacity-50 cursor-not-allowed");
	} else {
		BASE_CLASSES.push("cursor-pointer");
	}

	if (isToday(date)) {
		BASE_CLASSES.push("bg-gray-800 dark:bg-gray-900 text-white hover:bg-black");
	} else if (selectedDays.some((d) => isSameDay(d, date)) && !isWeekend(date) && !isHoliday(date)) {
		BASE_CLASSES.push("bg-primary text-primary-foreground hover:bg-primary/90");
	} else if (isHoliday(date)) {
		BASE_CLASSES.push("bg-yellow-300 text-yellow-800 hover:bg-yellow-400");
	} else if (isWeekend(date)) {
		BASE_CLASSES.push("bg-gray-200 dark:bg-gray-900 text-muted-foreground hover:bg-gray-300");
	} else {
		const isSuggested = isDaySuggested(date);
		const isAlternative = isDayAlternative(date);

		if (!isSuggested && !isAlternative) {
			BASE_CLASSES.push("hover:bg-gray-200 dark:hover:bg-gray-800");
		}
	}

	return BASE_CLASSES.join(" ");
}
