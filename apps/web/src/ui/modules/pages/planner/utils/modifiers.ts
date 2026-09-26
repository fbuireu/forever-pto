import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import { dayIndex, isBefore, isSameDay, startOfDay } from "@application/shared/utils/dates";
import type { HolidaysState } from "@application/stores/holidays";
import type { Suggestion } from "@domain/calendar/types";
import type { FromTo } from "../calendar/Calendar";

const daySetOf = (dates: Date[]) => new Set(dates.map(dayIndex));

export const isHoliday = (holidays: HolidaysState["holidays"]) => {
	const days = daySetOf(holidays.map(({ date }) => date));
	return (date: Date) => days.has(dayIndex(date));
};

export interface IsPastParams {
	allowPastDays: boolean;
	today: Date | null;
}

export const isPast = ({ allowPastDays, today }: IsPastParams) => {
	if (allowPastDays || !today) {
		return () => false;
	}

	const todayStart = startOfDay(today);

	return (date: Date) => isBefore({ date, dateToCompare: todayStart });
};

export const isToday = (today: Date | null) => {
	const todayIndex = today ? dayIndex(today) : null;
	return (date: Date) => todayIndex !== null && dayIndex(date) === todayIndex;
};

export interface IsSuggestionParams {
	currentSelection: Suggestion | null;
	removedSuggestedDays?: Date[];
}

export const isSuggestion = ({ currentSelection, removedSuggestedDays = [] }: IsSuggestionParams) => {
	if (!currentSelection) return () => false;

	const removed = daySetOf(removedSuggestedDays);
	const suggested = daySetOf(currentSelection.days);

	return (date: Date) => {
		const index = dayIndex(date);
		return !removed.has(index) && suggested.has(index);
	};
};

export const isManuallySelected = (manuallySelectedDays: Date[]) => {
	const days = daySetOf(manuallySelectedDays);
	return (date: Date) => days.has(dayIndex(date));
};

interface IsAlternativeParams {
	alternatives: HolidaysState["alternatives"];
	suggestion: Suggestion | null;
	previewAlternativeIndex: number;
	currentSelection?: Suggestion | null;
}

export const isAlternative = ({
	alternatives,
	suggestion,
	previewAlternativeIndex,
	currentSelection,
}: IsAlternativeParams) => {
	const targetSuggestion = previewAlternativeIndex === 0 ? suggestion : alternatives[previewAlternativeIndex - 1];
	if (!targetSuggestion?.days) return () => false;

	const selected = daySetOf(currentSelection?.days ?? []);
	const target = daySetOf(targetSuggestion.days);

	return (date: Date) => {
		const index = dayIndex(date);
		return !selected.has(index) && target.has(index);
	};
};

const holidayDaysOf = (holidays: HolidayDTO[], variants: readonly HolidayDTO["variant"][]) =>
	daySetOf(holidays.filter(({ variant }) => variants.includes(variant)).map(({ date }) => date));

export const isCustom = (holidays: HolidayDTO[]) => {
	const days = holidayDaysOf(holidays, [HolidayVariant.CUSTOM]);
	return (date: Date) => days.has(dayIndex(date));
};

export const isNationalOrRegionalHoliday = (holidays: HolidayDTO[]) => {
	const days = holidayDaysOf(holidays, [HolidayVariant.NATIONAL, HolidayVariant.REGIONAL]);
	return (date: Date) => days.has(dayIndex(date));
};

export const isSelected = (selectedDates: Date[]) => {
	const days = daySetOf(selectedDates);
	return (date: Date) => days.has(dayIndex(date));
};

export const isInRange =
	({ from, to }: Partial<FromTo>) =>
	(date: Date) => {
		if (!from || !to) return false;
		return date >= from && date <= to;
	};

export const isRangeStart = (range?: Partial<FromTo>) => (date: Date) => {
	if (!range?.from) return false;
	return isSameDay({ a: date, b: range.from });
};

export const isRangeEnd = (range?: Partial<FromTo>) => (date: Date) => {
	if (!range?.to) return false;
	return isSameDay({ a: date, b: range.to });
};

export const isRangeSelected = (range?: Partial<FromTo>) => (date: Date) => {
	return isRangeStart(range)(date) || isRangeEnd(range)(date);
};

interface GetPreviewRangeParams {
	range?: Partial<FromTo>;
	isSelectingTo?: boolean;
	hoverDate?: Date;
}

export const getPreviewRange =
	({ range, isSelectingTo, hoverDate }: GetPreviewRangeParams) =>
	(date: Date) => {
		if (!range?.from || !isSelectingTo || !hoverDate) return false;

		const start = range.from;
		const end = hoverDate;

		const minDate = start <= end ? start : end;
		const maxDate = start <= end ? end : start;

		return date >= minDate && date <= maxDate;
	};
