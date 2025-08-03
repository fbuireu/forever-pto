'use client';

import { getLocalizedDateFns } from '@application/i18n/localize';
import { useFetchHolidays, useHolidaysStore } from '@application/stores/holidays';
import { usePtoStore } from '@application/stores/pto';
import { Calendar } from '@const/components/ui/calendar';
import { addMonths, format, isWeekend, startOfMonth } from 'date-fns';
import { useLocale } from 'next-intl';
import { memo, useEffect, useMemo } from 'react';
import { isHoliday, isPastDay } from './utils/modifiers';

const MemoizedCalendar = memo(Calendar);

const CALENDAR_COMPONENTS = {
  Chevron: () => <></>,
  Dropdown: () => <></>,
};

const WEEKEND_CLASSES =
  'text-muted-foreground bg-muted rounded-md enabled:hover:text-accent-foreground enabled:hover:bg-accent/50 transition-colors';
const HOLIDAY_CLASSES =
  'bg-yellow-300 text-yellow-800 enabled:hover:bg-yellow-400 font-semibold rounded-md transition-colors';

export const CalendarList = () => {
  const locale = useLocale();
  const fetchHolidays = useFetchHolidays();
  const { carryOverMonths, year, allowPastDays, country, region } = usePtoStore();
  const { holidays } = useHolidaysStore();

  useEffect(() => {
    if (!country) return;
    fetchHolidays({ year, region, country, locale });
  }, [fetchHolidays, year, region, country, locale]);

  const months = useMemo(() => {
    const totalMonths = 12 + carryOverMonths;
    const start = startOfMonth(new Date(Number(year), 0, 1));

    return Array.from({ length: totalMonths }, (_, i) => addMonths(start, i));
  }, [carryOverMonths, year]);

  const localizedDateFns = useMemo(() => getLocalizedDateFns(locale), [locale]);

  const holidayModifier = useMemo(() => isHoliday(holidays), [holidays]);
  const pastDayModifier = useMemo(() => isPastDay(allowPastDays), [allowPastDays]);

  const modifiers = useMemo(
    () => ({
      weekend: isWeekend,
      holiday: holidayModifier,
    }),
    [holidayModifier, pastDayModifier]
  );

  const modifiersClassNames = useMemo(
    () => ({
      weekend: WEEKEND_CLASSES,
      holiday: HOLIDAY_CLASSES,
    }),
    []
  );

  return (
    <section className='flex w-full flex-col items-center gap-8'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7'>
        {months.map((month, index) => {
          const key = `${format(month, 'yyyy-MM')}-${index}`;

          return (
            <MemoizedCalendar
              key={key}
              mode='multiple'
              className='rounded-md'
              defaultMonth={month}
              month={month}
              weekStartsOn={1}
              fixedWeeks
              locale={localizedDateFns}
              modifiers={modifiers}
              disabled={pastDayModifier}
              modifiersClassNames={modifiersClassNames}
              components={CALENDAR_COMPONENTS}
            />
          );
        })}
      </div>
    </section>
  );
};
