'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { isWeekend } from 'date-fns';
import { useLocale } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { Calendar } from '../core/Calendar';
import { CalendarListSkeleton } from '../skeletons/CalendarListSkeleton';
import { getTotalMonths } from '../utils/helpers';
import {
  isAlternative as isAlternativeFn,
  isHoliday,
  isPast as isPastFn,
  isSuggestion as isSuggestionFn,
  isToday,
} from '../utils/modifiers';

export const CalendarList = () => {
  const locale = useLocale();
  const { carryOverMonths, year, allowPastDays, country, region, ptoDays, strategy } = useFiltersStore();
  const {
    holidays,
    alternatives,
    suggestion,
    currentSelection,
    fetchHolidays,
    generateSuggestions,
    previewAlternativeIndex,
  } = useHolidaysStore();
  const { isReady } = useStoresReady();

  const months = useMemo(() => getTotalMonths({ carryOverMonths, year }), [carryOverMonths, year]);

  useEffect(() => {
    if (!country) return;
    fetchHolidays({ year, region, country, locale });
  }, [fetchHolidays, year, region, country, locale]);

  useEffect(() => {
    if (ptoDays > 0 && holidays.length > 0 && months.length > 0) {
      generateSuggestions({
        year: parseInt(year),
        ptoDays,
        allowPastDays,
        months,
        strategy,
      });
    }
  }, [generateSuggestions, year, ptoDays, allowPastDays, holidays, months, strategy]);

  const modifiers = useMemo(() => {
    const holidayFn = isHoliday(holidays);
    const isPast = isPastFn(allowPastDays);
    const isSuggestion = isSuggestionFn(currentSelection);
    const isAlternative = isAlternativeFn(alternatives, suggestion, previewAlternativeIndex, currentSelection);

    return {
      weekend: isWeekend,
      holiday: holidayFn,
      today: isToday,
      suggested: isSuggestion,
      alternative: isAlternative,
      disabled: isPast,
    };
  }, [holidays, allowPastDays, currentSelection, alternatives, suggestion, previewAlternativeIndex]);

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'>
      {isReady ? (
        months.map((month) => (
          <Calendar
            key={month.toISOString()}
            mode='multiple'
            className='rounded-lg border shadow-sm bg-card'
            month={month}
            weekStartsOn={1}
            locale={locale}
            modifiers={modifiers}
            disabled={modifiers.disabled}
            holidays={holidays}
            showOutsideDays
            fixedWeeks
          />
        ))
      ) : (
        <CalendarListSkeleton />
      )}
    </div>
  );
};
