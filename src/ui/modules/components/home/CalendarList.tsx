'use client';

import { getLocalizedDateFns } from '@application/i18n/localize';
import { useHolidaysStore } from '@application/stores/holidays';
import { usePtoStore } from '@application/stores/pto';
import { Calendar } from '@const/components/ui/calendar';
import { addMonths, isWeekend, startOfMonth } from 'date-fns';
import { useLocale } from 'next-intl';
import { isHoliday } from './utils/modifiers';

export const CalendarList = () => {
  const locale = useLocale();
  const { carryOverMonths, year } = usePtoStore();
  const { holidays } = useHolidaysStore();
  const totalMonths = 12 + carryOverMonths;
  const start = startOfMonth(new Date(Number(year), 0, 1));
  const months = Array.from({ length: totalMonths }, (_, i) => addMonths(start, i));

  return (
    <section className='flex w-full flex-col items-center gap-8'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7'>
        {months.map((month) => {
          return (
            <Calendar
              key={String(month)}
              mode='multiple'
              // selected={selectedDays}
              // onSelect={handleDaySelect}
              className='rounded-md'
              defaultMonth={month}
              month={month}
              weekStartsOn={1}
              fixedWeeks
              locale={getLocalizedDateFns(locale)}
              modifiers={{
                weekend: isWeekend,
                holiday: isHoliday(holidays),
              }}
              modifiersClassNames={{
                weekend:
                  'text-muted-foreground bg-muted rounded-md hover:text-accent-foreground hover:bg-accent/50 transition-colors',
                holiday: 'bg-yellow-300 text-yellow-800 hover:bg-yellow-400 font-semibold rounded-md transition-colors',
              }}
              components={{
                Chevron: () => <></>,
                Dropdown: () => <></>,
                //   Day:
              }}
            />
          );
        })}
      </div>
    </section>
  );
};
