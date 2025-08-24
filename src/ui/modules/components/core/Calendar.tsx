import type { HolidayDTO } from '@application/dto/holiday/types';
import { Button } from '@const/components/ui/button';
import { cn } from '@const/lib/utils';
import type { Day } from 'date-fns';
import { isSameDay, isSameMonth } from 'date-fns';
import type { Locale } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { formatDay, formatMonthYear } from '../utils/formatters';
import { getCalendarDays, getWeekdayNames } from '../utils/helpers';
import { ConditionalWrapper } from './ConditionalWrapper';
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
  className?: string;
  weekStartsOn?: Day;
  fixedWeeks?: boolean;
  locale: Locale;
  modifiers?: Record<string, (date: Date) => boolean>;
  disabled?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  holidays: HolidayDTO[];
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  month,
  className,
  weekStartsOn = 1,
  fixedWeeks = false,
  locale,
  modifiers = {},
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

  const holidaysMap = useMemo(() => {
    const map = new Map<string, string>();
    holidays.forEach((holiday) => {
      const key = holiday.date.toDateString();
      map.set(key, holiday.name);
    });
    return map;
  }, [holidays]);

  const handleDayClick = useCallback(
    (date: Date) => {
      if (disabled?.(date)) return;

      if (mode === 'multiple') {
        const isSelected = selectedDates.some((d) => isSameDay(d, date));
        const newSelection = isSelected ? selectedDates.filter((d) => !isSameDay(d, date)) : [...selectedDates, date];

        setSelectedDates(newSelection);
        onSelect?.(newSelection);
      } else if (mode === 'single') {
        setSelectedDates([date]);
        onSelect?.(date);
      }
    },
    [disabled, mode, selectedDates, onSelect]
  );

  return (
    <div className={cn('calendar-container p-3 w-fit select-none', className)} {...props}>
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

      <div className='grid grid-cols-7 gap-2'>
        {calendarDays.map((date) => {
          const isDisabled = disabled?.(date);
          const isOutsideMonth = !isSameMonth(date, month);

          if (!showOutsideDays && isOutsideMonth) {
            return <div key={date.toISOString()} className='h-8 w-8' />;
          }

          const holidayName = holidaysMap.get(date.toDateString());

          const baseClasses = getDayClassNames({
            date,
            month,
            selectedDates,
            disabled,
            showOutsideDays,
            modifiers,
          });

          const classes = cn(baseClasses, 'calendar-day-button');

          return (
            <div key={date.toISOString()} className='calendar-day rounded-md relative h-8 w-8 p-0'>
              <ConditionalWrapper
                doWrap={!!holidayName}
                wrapper={(children) => (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>{children}</TooltipTrigger>
                      <TooltipContent>{holidayName}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              >
                <Button
                  type='button'
                  className={classes}
                  variant='ghost'
                  onClick={() => handleDayClick(date)}
                  disabled={isDisabled}
                >
                  {formatDay({ date, locale })}
                </Button>
              </ConditionalWrapper>
            </div>
          );
        })}
      </div>
    </div>
  );
}
