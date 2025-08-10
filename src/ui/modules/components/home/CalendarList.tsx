'use client';

import { getLocalizedDateFns } from '@application/i18n/localize';
import { useHolidaysStore } from '@application/stores/holidays';
import { usePtoStore } from '@application/stores/pto';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { format, isWeekend } from 'date-fns';
import { useLocale } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { Calendar } from '../core/Calendar';
import { getTotalMonths } from '../utils/helpers';
import { isHoliday, isPastDay, isToday as isTodayModifier } from '../utils/modifiers';
import './calendar-list.scss';

const MODIFIERS_CLASS_NAMES = {
  weekend: 'text-muted-foreground bg-muted/50 hover:bg-muted transition-colors',
  holiday:
    'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-500 hover:to-yellow-600 font-semibold shadow-sm transition-bg duration-200 ring-2 ring-yellow-200 dark:ring-yellow-300',
  today: 'bg-accent text-accent-foreground font-medium ring-2 ring-ring',
  suggested:
    'bg-teal-400 dark:bg-teal-600 hover:bg-teal-500 dark:hover:bg-teal-700 ring-2 ring-teal-300 dark:ring-teal-400 text-white font-semibold  transition-b duration-200 shadow-md',
};

export const CalendarList = () => {
  const locale = useLocale();
  const { carryOverMonths, year, allowPastDays, country, region, ptoDays } = usePtoStore();
  const {
    holidays,
    fetchHolidays,
    generateSuggestions,
    isDateSuggested,
    isDateAlternative,
    suggestedBlocks,
    alternativeBlocks,
  } = useHolidaysStore();

  const months = useMemo(() => getTotalMonths({ carryOverMonths, year }), [carryOverMonths, year]);

  const { isReady } = useStoresReady();

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
      });
    }
  }, [generateSuggestions, year, ptoDays, allowPastDays, holidays, months]);

  const holidayModifier = useMemo(() => {
    const holidayFn = isHoliday(holidays);
    return (date: Date) => holidayFn(date);
  }, [holidays]);

  const pastDayModifier = useMemo(() => {
    const pastFn = isPastDay(allowPastDays);
    return (date: Date) => pastFn(date);
  }, [allowPastDays]);

  const modifiers = useMemo(
    () => ({
      weekend: isWeekend,
      holiday: holidayModifier,
      today: isTodayModifier,
      suggested: isDateSuggested,
    }),
    [holidayModifier, isDateSuggested]
  );

  const modifiersClassNames = useMemo(() => MODIFIERS_CLASS_NAMES, []);

  if (!isReady) return null;

  return (
    <section className='flex w-full flex-col items-center gap-8'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'>
        {months.map((month) => (
          <Calendar
            key={format(month, 'yyyy-MM')}
            mode='multiple'
            className='rounded-lg border shadow-sm bg-card'
            month={month}
            weekStartsOn={1}
            locale={getLocalizedDateFns(locale)}
            modifiers={modifiers}
            disabled={pastDayModifier}
            modifiersClassNames={modifiersClassNames}
            holidays={holidays}
            suggestedBlocks={suggestedBlocks}
            alternativeBlocks={alternativeBlocks}
            showOutsideDays
            fixedWeeks
          />
        ))}
      </div>
    </section>
  );
};
