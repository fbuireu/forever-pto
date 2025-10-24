'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useLocale } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { Calendar, CalendarSelectionMode } from '../core/Calendar';
import { CalendarListSkeleton } from '../skeletons/CalendarListSkeleton';
import { getTotalMonths } from '../utils/helpers';

export const CalendarList = () => {
  const locale = useLocale();
  const { areStoresReady } = useStoresReady();

  const carryOverMonths = useFiltersStore((state) => state.carryOverMonths);
  const year = useFiltersStore((state) => state.year);
  const allowPastDays = useFiltersStore((state) => state.allowPastDays);
  const country = useFiltersStore((state) => state.country);
  const region = useFiltersStore((state) => state.region);
  const ptoDays = useFiltersStore((state) => state.ptoDays);
  const strategy = useFiltersStore((state) => state.strategy);

  const holidays = useHolidaysStore((state) => state.holidays);
  const alternatives = useHolidaysStore((state) => state.alternatives);
  const suggestion = useHolidaysStore((state) => state.suggestion);
  const currentSelection = useHolidaysStore((state) => state.currentSelection);
  const fetchHolidays = useHolidaysStore((state) => state.fetchHolidays);
  const generateSuggestions = useHolidaysStore((state) => state.generateSuggestions);
  const previewAlternativeIndex = useHolidaysStore((state) => state.previewAlternativeIndex);

  const months = useMemo(() => getTotalMonths({ carryOverMonths, year }), [carryOverMonths, year]);

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
          showOutsideDays
          fixedWeeks
        />
      ))}
    </div>
  );
};
