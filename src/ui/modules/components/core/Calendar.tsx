import type { FiltersState } from '@application/stores/filters';
import type { HolidaysState } from '@application/stores/holidays';
import { cn } from '@const/lib/utils';
import type { Day } from 'date-fns';
import { addMonths, isSameDay, isSameMonth, isWeekend, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Locale } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { formatDate } from '../utils/formatters';
import { getCalendarDays, getWeekdayNames } from '../utils/helpers';
import {
  isAlternative as isAlternativeFn,
  isCustom as isCustomFn,
  isHoliday,
  isPast as isPastFn,
  isSelected as isSelectedFn,
  isSuggestion as isSuggestionFn,
  isToday,
} from '../utils/modifiers';
import { ConditionalWrapper } from './ConditionalWrapper';
import { getDayClassNames } from './utils/helpers';

export interface FromTo {
  from: Date;
  to: Date;
}

interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[] | FromTo;
  onSelect?: (date: Date | Date[] | FromTo | undefined) => void;
  month?: Date;
  showNavigation?: boolean;
  className?: string;
  weekStartsOn?: Day;
  fixedWeeks?: boolean;
  locale: Locale;
  disabled?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  holidays: HolidaysState['holidays'];
  allowPastDays: FiltersState['allowPastDays'];
  currentSelection: HolidaysState['currentSelection'];
  alternatives: HolidaysState['alternatives'];
  suggestion: HolidaysState['suggestion'];
  previewAlternativeIndex?: HolidaysState['previewAlternativeIndex'];
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  month: initialMonth,
  showNavigation = false,
  className,
  weekStartsOn = 1,
  fixedWeeks = false,
  locale,
  disabled,
  showOutsideDays = true,
  holidays,
  allowPastDays = true,
  currentSelection,
  alternatives = [],
  suggestion,
  previewAlternativeIndex = -1,
  ...props
}: Readonly<CalendarProps>) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? new Date());

  const [selectedDates, setSelectedDates] = useState<Date[]>(() => {
    if (mode === 'multiple' && Array.isArray(selected)) {
      return selected;
    }
    if (mode === 'single' && selected instanceof Date) {
      return [selected];
    }
    return [];
  });

  const modifiers = useMemo(() => {
    const holidayFn = isHoliday(holidays);
    const customFn = isCustomFn(holidays);
    const isPast = isPastFn(allowPastDays);
    const isSuggestion = isSuggestionFn(currentSelection);
    const isAlternative = isAlternativeFn({ alternatives, suggestion, previewAlternativeIndex, currentSelection });
    const isSelected = isSelectedFn(selectedDates);

    return {
      weekend: isWeekend,
      holiday: holidayFn,
      custom: customFn,
      today: isToday,
      suggested: isSuggestion,
      alternative: isAlternative,
      disabled: isPast,
      selected: isSelected,
    };
  }, [holidays, allowPastDays, currentSelection, alternatives, suggestion, previewAlternativeIndex, selectedDates]);

  const weekdayNames = useMemo(() => getWeekdayNames({ locale, weekStartsOn }), [locale, weekStartsOn]);
  const monthYearLabel = useMemo(() => formatDate({ date: currentMonth, locale, format: 'LLLL yyyy' }), [currentMonth, locale]);
  const calendarDays = useMemo(
    () => getCalendarDays({ month: currentMonth, weekStartsOn, fixedWeeks }),
    [currentMonth, weekStartsOn, fixedWeeks]
  );

  const holidaysMap = useMemo(() => {
    const map = new Map<string, string>();
    holidays.forEach((holiday) => {
      const key = holiday.date.toDateString();
      map.set(key, holiday.name);
    });
    return map;
  }, [holidays]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth(subMonths(currentMonth, 1));
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1)); 
  }, [currentMonth]);  

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
        {showNavigation ? (
          <>
            <Button
              variant='ghost'
              type='button'
              size='sm'
              onClick={handlePreviousMonth}
              className='h-8 w-8 p-0 hover:bg-muted'
              aria-label='Previous month'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <h3 className='text-sm font-medium flex-1 text-center'>{monthYearLabel}</h3>
            <Button
              variant='ghost'
              type='button'
              size='sm'
              onClick={handleNextMonth}
              className='h-8 w-8 p-0 hover:bg-muted'
              aria-label='Next month'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </>
        ) : (
          <h3 className='text-sm font-medium'>{monthYearLabel}</h3>
        )}
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
          const isDisabled = disabled?.(date) ?? modifiers.disabled(date);
          const isOutsideMonth = !isSameMonth(date, currentMonth);

          if (!showOutsideDays && isOutsideMonth) {
            return <div key={date.toISOString()} className='h-8 w-8' />;
          }

          const holidayName = holidaysMap.get(date.toDateString());

          const baseClasses = getDayClassNames({
            date,
            month: currentMonth,
            selectedDates,
            disabled: () => isDisabled,
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
                  {formatDate({ date, locale, format: 'd' })}
                </Button>
              </ConditionalWrapper>
            </div>
          );
        })}
      </div>
    </div>
  );
}
