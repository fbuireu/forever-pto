import { HolidayDTO } from '@application/dto/holiday/types';
import { getDateKey } from '@application/stores/utils/helpers';
import { isWeekend } from 'date-fns';
import { Bridge, Suggestion } from '../types';
import { getOptimizedDateKey } from './cache';

export const deduplicateDays = (days: Date[]): Date[] => {
  const uniqueMap = new Map<string, Date>();

  days.forEach((day) => {
    const key = getOptimizedDateKey(day);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, day);
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) => a.getTime() - b.getTime());
};

export const validateAndCleanSuggestion = (suggestion: Suggestion): Suggestion => {
  const uniqueDays = deduplicateDays(suggestion.days);

  const efficiency = uniqueDays.length > 0 ? suggestion.totalEffectiveDays / uniqueDays.length : 0;

  return {
    ...suggestion,
    days: uniqueDays,
    efficiency,
  };
};

export const getCombinationKey = (days: Date[]): string => {
  return deduplicateDays(days)
    .map((d) => getOptimizedDateKey(d))
    .join(',');
};

export const areSuggestionsEqual = (s1: Suggestion, s2: Suggestion): boolean => {
  return getCombinationKey(s1.days) === getCombinationKey(s2.days);
};

export const filterDuplicateAlternatives = (alternatives: Suggestion[], mainSuggestion: Suggestion): Suggestion[] => {
  const usedKeys = new Set<string>();
  usedKeys.add(getCombinationKey(mainSuggestion.days));

  return alternatives.filter((alt) => {
    const key = getCombinationKey(alt.days);
    if (usedKeys.has(key)) {
      return false;
    }
    usedKeys.add(key);
    return true;
  });
};

export const cleanupSuggestion = (suggestion: {
  days: Date[];
  totalEffectiveDays: number;
  efficiency?: number;
  bridges?: Bridge[];
  strategy?: any;
}): Suggestion => {
  const cleanDays = deduplicateDays(suggestion.days);

  return {
    days: cleanDays,
    totalEffectiveDays: suggestion.totalEffectiveDays,
    efficiency: cleanDays.length > 0 ? suggestion.totalEffectiveDays / cleanDays.length : 0,
    bridges: suggestion.bridges,
    strategy: suggestion.strategy,
  };
};

export function getAvailableWorkdays({
  months,
  holidays,
  allowPastDays,
}: {
  months: Date[];
  holidays: HolidayDTO[];
  allowPastDays: boolean;
}): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const holidaySet = new Set<string>();
  for (const holiday of holidays) {
    const date = new Date(holiday.date);
    if (!isWeekend(date)) {
      const key = getDateKey(date);
      holidaySet.add(key);
    }
  }

  const workdays: Date[] = [];

  for (const month of months) {
    const year = month.getFullYear();
    const monthNum = month.getMonth();

    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);

      if (!allowPastDays && date.getTime() < todayTime) continue;

      if (isWeekend(date)) continue;

      const key = getDateKey(date);
      if (holidaySet.has(key)) continue;

      workdays.push(date);
    }
  }

  return workdays;
}

export function isFreeDay(date: Date, holidaySet: Set<string>): boolean {
  return isWeekend(date) || holidaySet.has(getDateKey(date));
}

export function createHolidaySet(holidays: HolidayDTO[]): Set<string> {
  return new Set(
    holidays
      .filter((h) => {
        const date = new Date(h.date);
        return !isWeekend(date);
      })
      .map((h) => {
        const date = new Date(h.date);
        return getDateKey(date);
      })
  );
}