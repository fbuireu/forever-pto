import { HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import type { HolidaysState } from '@application/stores/holidays';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { isBefore, isSameDay, startOfToday } from 'date-fns';

export const isHoliday = (holidays: HolidaysState['holidays']) => (date: Date) =>
  holidays.some((holiday) => isSameDay(date, holiday.date));

export const isPast = (allowPastDays: boolean) => {
  if (allowPastDays) {
    return () => false;
  }

  const today = startOfToday();

  return (date: Date) => isBefore(date, today);
};

// fixes: https://github.com/date-fns/date-fns/issues/583
export const isToday = (date: Date) => isSameDay(date, new Date());

export const isSuggestion = (currentSelection: Suggestion | null) => {
  return (date: Date): boolean => {
    if (!currentSelection) return false;

    return currentSelection.days.some((d) => isSameDay(d, date));
  };
};

export const isAlternative = (
  alternatives: HolidaysState['alternatives'],
  suggestion: Suggestion | null,
  temporalSelectionIndex: number,
  currentSelection?: Suggestion | null
) => {
  return (date: Date): boolean => {
    if (currentSelection?.days.some((d) => isSameDay(d, date))) {
      return false;
    }

    const targetSuggestion = temporalSelectionIndex === 0 ? suggestion : alternatives[temporalSelectionIndex - 1];

    if (!targetSuggestion?.days) return false;

    return targetSuggestion?.days.some((d) => isSameDay(d, date)) ?? false;
  };
};

export const isCustom = (holidays: HolidayDTO[]) => (date: Date) => {
  return holidays.some(
    (holiday) => 
      isSameDay(holiday.date, date) && 
      holiday.variant === HolidayVariant.CUSTOM 
  );
};