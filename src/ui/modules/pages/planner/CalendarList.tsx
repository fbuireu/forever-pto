'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useCalculationsWorker } from '@ui/hooks/useCalculationsWorker';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { cn } from '@ui/utils/utils';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Calendar, CalendarSelectionMode } from './calendar/Calendar';
import { CalendarListSkeleton } from './calendar/CalendarListSkeleton';
import { getTotalMonths } from './utils/helpers';

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
    isCalculating,
    manuallySelectedDays,
    removedSuggestedDays,
    fetchHolidays,
    previewAlternativeIndex,
    toggleDaySelection,
  } = useHolidaysStore(
    useShallow((state) => ({
      holidays: state.holidays,
      alternatives: state.alternatives,
      suggestion: state.suggestion,
      currentSelection: state.currentSelection,
      isCalculating: state.isCalculating,
      manuallySelectedDays: state.manuallySelectedDays,
      removedSuggestedDays: state.removedSuggestedDays,
      fetchHolidays: state.fetchHolidays,
      previewAlternativeIndex: state.previewAlternativeIndex,
      toggleDaySelection: state.toggleDaySelection,
    }))
  );

  const { triggerCalculation } = useCalculationsWorker();

  const months = useMemo(() => getTotalMonths({ carryOverMonths, year }), [carryOverMonths, year]);

  const remainingDays = useMemo(() => {
    const activeSuggestedCount = (currentSelection?.days.length || 0) - removedSuggestedDays.length;
    const manualSelectedCount = manuallySelectedDays.length;
    return Math.max(0, ptoDays - activeSuggestedCount - manualSelectedCount);
  }, [currentSelection, removedSuggestedDays, manuallySelectedDays, ptoDays]);
  const canSelectMoreDays = remainingDays > 0;

  const handleDayToggle = useCallback(
    (date: Date) => {
      toggleDaySelection({ date, totalPtoDays: ptoDays, locale, allowPastDays });
    },
    [toggleDaySelection, ptoDays, locale, allowPastDays]
  );

  useEffect(() => {
    if (!country) return;
    fetchHolidays({ year, region, country, locale, carryOverMonths });
  }, [fetchHolidays, year, region, country, locale, carryOverMonths]);

  useEffect(() => {
    if (ptoDays > 0 && holidays.length > 0 && months.length > 0) {
      triggerCalculation({
        year: parseInt(year, 10),
        ptoDays,
        allowPastDays,
        months,
        strategy,
        locale,
      });
    }
  }, [triggerCalculation, year, ptoDays, allowPastDays, holidays, months, strategy, locale]);

  if (!areStoresReady) {
    return <CalendarListSkeleton />;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-5 mx-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
        isCalculating && 'pointer-events-none'
      )}
      data-tutorial='calendar-list'
    >
      {months.map((month) => (
        <Calendar
          key={month.toISOString()}
          mode={CalendarSelectionMode.NONE}
          className='rounded-[14px] border-[3px] border-[var(--frame)] bg-card shadow-[var(--shadow-brutal-md)] [content-visibility:auto] [contain-intrinsic-block-size:340px]'
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
