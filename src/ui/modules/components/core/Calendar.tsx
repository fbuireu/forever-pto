import { HolidayDTO } from '@application/dto/holiday/types';
import { Button } from '@const/components/ui/button';
import { cn } from '@const/lib/utils';
import { Day, isSameDay, isSameMonth } from 'date-fns';
import { Locale } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { formatDay, formatMonthYear } from '../utils/formatters';
import { getCalendarDays, getDayLabel, getWeekdayNames } from '../utils/helpers';
import { getDayClassNames } from './utils/helpers';

interface FromTo {
  from: Date;
  to: Date;
}

interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[] | FromTo;
  onSelect?: (date: Date | Date[] | FromTo | undefined) => void;
  month: Date;
  defaultMonth?: Date;
  className?: string;
  weekStartsOn?: Day;
  fixedWeeks?: boolean;
  locale: Locale;
  modifiers?: Record<string, (date: Date) => boolean>;
  modifiersClassNames?: Record<string, string>;
  disabled?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  holidays: HolidayDTO[];
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  month,
  defaultMonth = new Date(),
  className,
  weekStartsOn = 1,
  fixedWeeks = false,
  locale,
  modifiers = {},
  modifiersClassNames = {},
  disabled,
  showOutsideDays = true,
  holidays,
  ...props
}: Readonly<CalendarProps>) {
  const [selectedDates, setSelectedDates] = useState<Date[]>(() => {
    if (mode === 'multiple' && Array.isArray(selected)) {
      return selected;
    }
    if (mode === 'single' && selected instanceof Date) {
      return [selected];
    }
    return [];
  });

  const weekdayNames = useMemo(() => getWeekdayNames({ locale, weekStartsOn }), [locale, weekStartsOn]);
  const monthYearLabel = useMemo(() => formatMonthYear({ date: month, locale }), [month, locale]);

  const calendarDays = useMemo(
    () => getCalendarDays({ month, weekStartsOn, fixedWeeks }),
    [month, weekStartsOn, fixedWeeks]
  );

  const handleDayClick = useCallback(
    (date: Date) => {
      if (disabled?.(date)) return;

      if (mode === 'multiple') {
        const isSelected = selectedDates.some((d) => isSameDay(d, date));
        let newSelection: Date[];

        if (isSelected) {
          newSelection = selectedDates.filter((d) => !isSameDay(d, date));
        } else {
          newSelection = [...selectedDates, date];
        }

        setSelectedDates(newSelection);
        onSelect?.(newSelection);
      } else if (mode === 'single') {
        const newSelection = [date];
        setSelectedDates(newSelection);
        onSelect?.(date);
      }
    },
    [disabled, mode, selectedDates, onSelect]
  );

  const getDayClasses = useCallback(
    (date: Date) =>
      getDayClassNames({
        date,
        month,
        selectedDates,
        disabled,
        showOutsideDays,
        modifiers,
        modifiersClassNames,
      }),
    [month, selectedDates, disabled, showOutsideDays, modifiers, modifiersClassNames]
  );

  return (
    <div className={cn('p-3 w-fit select-none', className)} {...props}>
      <div className='flex justify-center items-center mb-4'>
        <h3 className='text-sm font-medium'>{monthYearLabel}</h3>
      </div>
      <div className='grid grid-cols-7 gap-1 mb-2'>
        {weekdayNames.map((day) => (
          <div
            key={day}
            className='h-8 w-8 flex items-center justify-center text-[0.8rem] font-medium text-muted-foreground'
          >
            {day}
          </div>
        ))}
      </div>
      <div className='grid grid-cols-7 gap-1'>
        {calendarDays.map((date) => {
          const isDisabled = disabled?.(date);
          const isOutsideMonth = !isSameMonth(date, month);

          if (!showOutsideDays && isOutsideMonth) {
            return <div key={date.toISOString()} className='h-8 w-8' />;
          }
          return (
            <Button
              key={date.toISOString()}
              type='button'
              variant='ghost'
              className={cn(getDayClasses(date), 'rounded-md relative')}
              onClick={() => handleDayClick(date)}
              disabled={isDisabled}
              title={getDayLabel({ holidays, date })}
            >
              {formatDay({ date, locale })}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
