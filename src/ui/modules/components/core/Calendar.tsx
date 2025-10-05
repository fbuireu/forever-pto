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
  getPreviewRange,
  isAlternative,
  isCustom as isCustomFn,
  isHoliday,
  isInRange,
  isPast,
  isRangeEnd,
  isRangeStart,
  isSelected,
  isSuggestion,
  isToday,
} from '../utils/modifiers';
import { ConditionalWrapper } from './ConditionalWrapper';
import { getDayClassNames, isFromToObject } from './utils/helpers';

export interface FromTo {
  from: Date;
  to: Date;
}

export const CalendarSelectionMode = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  RANGE: 'range',
  NONE: 'none',
} as const;

export type CalendarSelectionMode = (typeof CalendarSelectionMode)[keyof typeof CalendarSelectionMode];

export const RangeSelection = {
  FROM: 'from',
  TO: 'to',
} as const;

export type RangeSelection = (typeof RangeSelection)[keyof typeof RangeSelection];

interface CalendarProps {
  mode?: CalendarSelectionMode;
  selected?: Date | Date[] | FromTo;
  onSelect?: (date: Date | Date[] | FromTo | undefined) => void;
  month?: Date;
  showNavigation?: boolean;
  className?: string;
  weekStartsOn?: Day;
  fixedWeeks?: boolean;
  locale: Locale;
  disabled?: boolean;
  showOutsideDays?: boolean;
  holidays: HolidaysState['holidays'];
  allowPastDays: FiltersState['allowPastDays'];
  currentSelection: HolidaysState['currentSelection'];
  alternatives: HolidaysState['alternatives'];
  suggestion: HolidaysState['suggestion'];
  previewAlternativeIndex?: HolidaysState['previewAlternativeIndex'];
}

interface RangeState {
  from?: Date;
  to?: Date;
  selecting: RangeSelection;
}

export function Calendar({
  mode = CalendarSelectionMode.SINGLE,
  selected,
  onSelect,
  month: initialMonth,
  showNavigation = false,
  className,
  weekStartsOn = 1,
  fixedWeeks = false,
  locale,
  disabled = false,
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
  const [hoverDate, setHoverDate] = useState<Date | undefined>();
  const [rangeSelection, setRangeSelection] = useState<RangeState>(() => {
    if (mode === CalendarSelectionMode.RANGE && isFromToObject(selected)) {
      return {
        from: selected.from,
        to: selected.to,
        selecting: RangeSelection.FROM,
      };
    }
    return { selecting: RangeSelection.FROM };
  });

  const [selectedDates, setSelectedDates] = useState<Date[]>(() => {
    switch (mode) {
      case CalendarSelectionMode.MULTIPLE:
        return Array.isArray(selected) ? selected : [];
      case CalendarSelectionMode.SINGLE:
        return selected instanceof Date ? [selected] : [];
      case CalendarSelectionMode.RANGE:
        return isFromToObject(selected) ? [selected.from, selected.to] : [];
      default:
        return [];
    }
  });

  const modifiers = useMemo(() => {
    const holidayFn = isHoliday(holidays);
    const customFn = isCustomFn(holidays);
    const isPastFn = isPast(allowPastDays);
    const isSuggestionFn = isSuggestion(currentSelection);
    const isAlternativeFn = isAlternative({ alternatives, suggestion, previewAlternativeIndex, currentSelection });
    const isSelectedModifier =
      mode === CalendarSelectionMode.RANGE
        ? (date: Date) => isRangeStart(rangeSelection)(date) || isRangeEnd(rangeSelection)(date)
        : isSelected(selectedDates);

    const baseModifiers = {
      weekend: isWeekend,
      holiday: holidayFn,
      custom: customFn,
      today: isToday,
      suggested: isSuggestionFn,
      alternative: isAlternativeFn,
      disabled: isPastFn,
      selected: isSelectedModifier,
    };

    return {
      ...baseModifiers,
      ...(mode === CalendarSelectionMode.RANGE && {
        inRange: isInRange({ from: rangeSelection.from, to: rangeSelection.to }),
        rangeStart: isRangeStart(rangeSelection),
        rangeEnd: isRangeEnd(rangeSelection),
        previewRange: getPreviewRange({
          range: rangeSelection,
          isSelectingTo: rangeSelection.selecting === RangeSelection.TO,
          hoverDate,
        }),
      }),
    };
  }, [
    holidays,
    allowPastDays,
    currentSelection,
    alternatives,
    suggestion,
    previewAlternativeIndex,
    selectedDates,
    mode,
    rangeSelection,
    hoverDate,
  ]);

  const weekdayNames = useMemo(() => getWeekdayNames({ locale, weekStartsOn }), [locale, weekStartsOn]);
  const monthYearLabel = useMemo(
    () => formatDate({ date: currentMonth, locale, format: 'LLLL yyyy' }),
    [currentMonth, locale]
  );
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
      if (disabled || mode === CalendarSelectionMode.NONE) return;

      switch (mode) {
        case CalendarSelectionMode.MULTIPLE: {
          const isSelected = selectedDates.some((d) => isSameDay(d, date));
          const newSelection = isSelected ? selectedDates.filter((d) => !isSameDay(d, date)) : [...selectedDates, date];

          setSelectedDates(newSelection);
          onSelect?.(newSelection);
          break;
        }

        case CalendarSelectionMode.SINGLE: {
          setSelectedDates([date]);
          onSelect?.(date);
          break;
        }

        case CalendarSelectionMode.RANGE: {
          if (rangeSelection.selecting === RangeSelection.FROM || !rangeSelection.from) {
            const newRangeSelection: RangeState = {
              from: date,
              to: undefined,
              selecting: RangeSelection.TO,
            };
            setRangeSelection(newRangeSelection);
            onSelect?.(undefined);
          } else {
            const from = rangeSelection.from;
            const to = date;

            const orderedRange: FromTo = from <= to ? { from, to } : { from: to, to: from };

            const newRangeSelection: RangeState = {
              from: orderedRange.from,
              to: orderedRange.to,
              selecting: RangeSelection.FROM,
            };

            setRangeSelection(newRangeSelection);
            onSelect?.(orderedRange);
          }
          break;
        }
      }
    },
    [disabled, mode, selectedDates, onSelect, rangeSelection]
  );

  const handleDayHover = useCallback(
    (date: Date) => {
      if (
        mode === CalendarSelectionMode.RANGE &&
        rangeSelection.selecting === RangeSelection.TO &&
        rangeSelection.from
      ) {
        setHoverDate(date);
      }
    },
    [mode, rangeSelection]
  );

  const handleDayLeave = useCallback(() => {
    setHoverDate(undefined);
  }, []);

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
          const isDisabled = disabled ?? modifiers.disabled(date);
          const isOutsideMonth = !isSameMonth(date, currentMonth);

          if (!showOutsideDays && isOutsideMonth) {
            return <div key={date.toISOString()} className='h-8 w-8' />;
          }

          const holidayName = holidaysMap.get(date.toDateString());

          const baseClasses = getDayClassNames({
            date,
            month: currentMonth,
            selectedDates: mode === CalendarSelectionMode.RANGE ? [] : selectedDates,
            disabled,
            showOutsideDays,
            allowPastDays,
            modifiers,
          });

          const classes = cn(baseClasses, 'calendar-day-button');

          return (
            <div key={date.toISOString()} className='calendar-day rounded-md relative h-8 w-8 p-0'>
              <ConditionalWrapper
                doWrap={!!holidayName}
                wrapper={(children) => (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>{children}</TooltipTrigger>
                      <TooltipContent>{holidayName}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              >
                <Button
                  type='button'
                  className={cn(classes)}
                  variant='ghost'
                  onClick={() => handleDayClick(date)}
                  onMouseEnter={() => handleDayHover(date)}
                  onMouseLeave={handleDayLeave}
                  disabled={isDisabled}
                  {...(mode === CalendarSelectionMode.NONE && {
                    tapScale: 1,
                    hoverScale: 1,
                  })}
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
