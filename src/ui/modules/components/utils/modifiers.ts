import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import type { HolidaysState } from '@application/stores/holidays';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { isBefore, isSameDay, startOfToday } from 'date-fns';
import type { FromTo } from '../core/Calendar';

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

export const isSuggestion = (currentSelection: Suggestion | null, removedSuggestedDays: Date[] = []) => {
  return (date: Date): boolean => {
    if (!currentSelection) return false;

    const wasRemoved = removedSuggestedDays.some((d) => isSameDay(d, date));
    if (wasRemoved) return false;

    return currentSelection.days.some((d) => isSameDay(d, date));
  };
};

export const isManuallySelected = (manuallySelectedDays: Date[]) => {
  return (date: Date): boolean => {
    return manuallySelectedDays.some((d) => isSameDay(d, date));
  };
};

interface IsAlternativeParams {
  alternatives: HolidaysState['alternatives'];
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
  return (date: Date): boolean => {
    if (currentSelection?.days.some((d) => isSameDay(d, date))) {
      return false;
    }

    const targetSuggestion = previewAlternativeIndex === 0 ? suggestion : alternatives[previewAlternativeIndex - 1];

    if (!targetSuggestion?.days) return false;

    return targetSuggestion?.days.some((d) => isSameDay(d, date)) ?? false;
  };
};

export const isCustom = (holidays: HolidayDTO[]) => (date: Date) => {
  return holidays.some((holiday) => isSameDay(holiday.date, date) && holiday.variant === HolidayVariant.CUSTOM);
};

export const isSelected = (selectedDates: Date[]) => (date: Date) => selectedDates.some((d) => isSameDay(d, date));

export const isInRange =
  ({ from, to }: Partial<FromTo>) =>
  (date: Date): boolean => {
    if (!from || !to) return false;
    return date >= from && date <= to;
  };

export const isRangeStart =
  (range?: Partial<FromTo>) =>
  (date: Date): boolean => {
    if (!range?.from) return false;
    return isSameDay(date, range.from);
  };

export const isRangeEnd =
  (range?: Partial<FromTo>) =>
  (date: Date): boolean => {
    if (!range?.to) return false;
    return isSameDay(date, range.to);
  };

export const isRangeSelected =
  (range?: Partial<FromTo>) =>
  (date: Date): boolean => {
    return isRangeStart(range)(date) || isRangeEnd(range)(date);
  };

interface GetPreviewRangeParams {
  range?: Partial<FromTo>;
  isSelectingTo?: boolean;
  hoverDate?: Date;
}

export const getPreviewRange =
  ({ range, isSelectingTo, hoverDate }: GetPreviewRangeParams) =>
  (date: Date): boolean => {
    if (!range?.from || !isSelectingTo || !hoverDate) return false;

    const start = range.from;
    const end = hoverDate;

    const minDate = start <= end ? start : end;
    const maxDate = start <= end ? end : start;

    return date >= minDate && date <= maxDate;
  };
