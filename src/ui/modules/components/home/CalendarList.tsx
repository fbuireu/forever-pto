'use client';

import { getLocalizedDateFns } from '@application/i18n/localize';
import { useHolidaysStore } from '@application/stores/holidays';
import { usePtoStore } from '@application/stores/pto';
import { format, isWeekend } from 'date-fns';
import { useLocale } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { Calendar } from '../core/Calendar';
import { getTotalMonths } from '../utils/helpers';
import { isHoliday, isPastDay, isToday as isTodayModifier } from '../utils/modifiers';

const MODIFIERS_CLASS_NAMES = {
      weekend: 'text-muted-foreground bg-muted/50 hover:bg-muted transition-colors',
      holiday:
        'bg-gradient-to-br from-yellow-300 to-yellow-400 text-yellow-900 hover:from-yellow-400 hover:to-yellow-500 font-semibold shadow-sm transition-all duration-200',
      today: 'bg-accent text-accent-foreground font-medium ring-1 ring-ring',
    }

export const CalendarList = () => {
  const locale = useLocale();
  const { carryOverMonths, year, allowPastDays, country, region } = usePtoStore();
  const { holidays, fetchHolidays } = useHolidaysStore();

  useEffect(() => {
    if (!country) return;
    fetchHolidays({ year, region, country, locale });
  }, [fetchHolidays, year, region, country, locale]);

  const months = useMemo(() => getTotalMonths({ carryOverMonths, year }), [carryOverMonths, year]);

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
    }),
    [holidayModifier]
  );

  const modifiersClassNames = useMemo(() => MODIFIERS_CLASS_NAMES, []);

  return (
    <section className='flex w-full flex-col items-center gap-8'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7'>
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
            showOutsideDays
            fixedWeeks
          />
        ))}
      </div>
    </section>
  );
};
