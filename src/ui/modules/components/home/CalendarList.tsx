'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Calendar, CalendarSelectionMode } from '../core/Calendar';
import { CalendarListSkeleton } from '../skeletons/CalendarListSkeleton';
import { getTotalMonths } from '../utils/helpers';

export const CalendarList = () => {
  const locale = useLocale();
  const { areStoresReady } = useStoresReady();

  const { carryOverMonths, year, allowPastDays, country, region, ptoDays, strategy } = useFiltersStore(
    useShallow((state) => ({
      carryOverMonths: state.carryOverMonths,
      year: state.year,
      allowPastDays: state.allowPastDays,
      country: state.country,
      region: state.region,
      ptoDays: state.ptoDays,
      strategy: state.strategy,
    }))
  );
  const {
    holidays,
    alternatives,
    suggestion,
    currentSelection,
    manuallySelectedDays,
    removedSuggestedDays,
    fetchHolidays,
    generateSuggestions,
    previewAlternativeIndex,
    toggleDaySelection,
  } = useHolidaysStore(
    useShallow((state) => ({
      holidays: state.holidays,
      alternatives: state.alternatives,
      suggestion: state.suggestion,
      currentSelection: state.currentSelection,
      manuallySelectedDays: state.manuallySelectedDays,
      removedSuggestedDays: state.removedSuggestedDays,
      fetchHolidays: state.fetchHolidays,
      generateSuggestions: state.generateSuggestions,
      previewAlternativeIndex: state.previewAlternativeIndex,
      toggleDaySelection: state.toggleDaySelection,
    }))
  );

  const months = useMemo(() => getTotalMonths({ carryOverMonths, year }), [carryOverMonths, year]);

  const remainingDays = useMemo(() => {
    const activeSuggestedCount = (currentSelection?.days.length || 0) - removedSuggestedDays.length;
    const manualSelectedCount = manuallySelectedDays.length;
    return Math.max(0, ptoDays - activeSuggestedCount - manualSelectedCount);
  }, [currentSelection, removedSuggestedDays, manuallySelectedDays, ptoDays]);
  const canSelectMoreDays = remainingDays > 0;

  const handleDayToggle = useCallback(
    (date: Date) => {
      toggleDaySelection(date, ptoDays);
    },
    [toggleDaySelection, ptoDays]
  );

  useEffect(() => {
    if (!country) return;
    fetchHolidays({ year, region, country, locale, carryOverMonths });
  }, [fetchHolidays, year, region, country, locale, carryOverMonths]);

  useEffect(() => {
    if (ptoDays > 0 && holidays.length > 0 && months.length > 0) {
      generateSuggestions({
        year: parseInt(year),
        ptoDays,
        allowPastDays,
        months,
        strategy,
        locale,
      });
    }
  }, [generateSuggestions, year, ptoDays, allowPastDays, holidays, months, strategy, locale]);

  if (!areStoresReady) {
    return <CalendarListSkeleton />;
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'>
      {months.map((month) => (
        <Calendar
          key={month.toISOString()}
          mode={CalendarSelectionMode.NONE}
          className='rounded-lg border shadow-sm bg-card'
          month={month}
          weekStartsOn={1}
          locale={locale}
          holidays={holidays}
          allowPastDays={allowPastDays}
          currentSelection={currentSelection}
          alternatives={alternatives}
          suggestion={suggestion}
          previewAlternativeIndex={previewAlternativeIndex}
          manuallySelectedDays={manuallySelectedDays}
          removedSuggestedDays={removedSuggestedDays}
          onDayToggle={handleDayToggle}
          canSelectMoreDays={canSelectMoreDays}
          showOutsideDays
          fixedWeeks
        />
      ))}
    </div>
  );
};
