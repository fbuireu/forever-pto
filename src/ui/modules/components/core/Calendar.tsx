
import type { HolidayDTO } from '@application/dto/holiday/types';
import { Button } from '@const/components/ui/button';
import { cn } from '@const/lib/utils';
import { SuggestionBlock } from '@infrastructure/services/calendar/suggestions/types';
import type { Day } from 'date-fns';
import { isSameDay, isSameMonth } from 'date-fns';
import type { Locale } from 'next-intl';
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
  suggestedBlocks?: SuggestionBlock[];
  alternativeBlocks?: Record<string, SuggestionBlock[]>;
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
  suggestedBlocks = [],
  alternativeBlocks = {},
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

  const normalizeDate = useCallback((date: Date | string): string => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }, []);

  const isDateInBlock = useCallback(
    (date: Date, block: SuggestionBlock): boolean => {
      const targetDateStr = normalizeDate(date);
      return block.days.some((day) => normalizeDate(day) === targetDateStr);
    },
    [normalizeDate]
  );

  const getDayBlockInfo = useCallback(
    (date: Date) => {
      const suggestionBlock = suggestedBlocks.find((block) => isDateInBlock(date, block));
      
      // Encontrar todos los IDs de bloques donde este día es alternativo
      const alternativeForBlocks: string[] = [];
      Object.entries(alternativeBlocks).forEach(([blockId, alternatives]) => {
        if (alternatives.some(alt => isDateInBlock(date, alt))) {
          alternativeForBlocks.push(blockId);
        }
      });

      return {
        suggestionBlock,
        alternativeForBlocks,
      };
    },
    [suggestedBlocks, alternativeBlocks, isDateInBlock]
  );

  const getDayClasses = useCallback(
    (date: Date) => {
      const baseClasses = getDayClassNames({
        date,
        month,
        selectedDates,
        disabled,
        showOutsideDays,
        modifiers,
        modifiersClassNames,
      });

      return cn(baseClasses, 'calendar-day-button');
    },
    [month, selectedDates, disabled, showOutsideDays, modifiers, modifiersClassNames]
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
          const { suggestionBlock, alternativeForBlocks } = getDayBlockInfo(date);

          if (!showOutsideDays && isOutsideMonth) {
            return <div key={date.toISOString()} className='h-8 w-8' />;
          }

          return (
            <div
              role='group'
              key={date.toISOString()}
              className='calendar-day rounded-md relative h-8 w-8 p-0'
              {...(suggestionBlock?.id ? { 'data-block-id': suggestionBlock.id } : {})}
              {...(alternativeForBlocks.length ? { 'data-alternative-for': alternativeForBlocks.join(' ') } : {})}
            >
              <Button
                type='button'
                className={getDayClasses(date)}
                variant='ghost'
                onClick={() => handleDayClick(date)}
                disabled={isDisabled}
                title={getDayLabel({ holidays, date })}
              >
                <span className='relative z-10'>{formatDay({ date, locale })}</span>
              </Button>
              {suggestionBlock && alternativeBlocks[suggestionBlock.id]?.length > 0 && (
                <span className='absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full border shadow-sm ring-2 ring-orange-400 z-30' />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
