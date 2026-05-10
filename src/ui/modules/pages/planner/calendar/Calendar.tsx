import type { FiltersState } from '@application/stores/filters';
import type { HolidaysState } from '@application/stores/holidays';
import { usePremiumStore } from '@application/stores/premium';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ui/modules/core/animate/base/Tooltip';
import { ChevronLeft } from '@ui/modules/core/animate/icons/ChevronLeft';
import { ChevronRight } from '@ui/modules/core/animate/icons/ChevronRight';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Button } from '@ui/modules/core/primitives/Button';
import { SupportButton } from '@ui/modules/pages/homepage/navigation/SupportButton';
import { ConditionalWrapper } from '@ui/modules/shared/ConditionalWrapper';
import { addMonths, type Day, formatDate, isSameDay, isSameMonth, isWeekend, subMonths } from '@ui/utils/dates';
import { cn } from '@ui/utils/utils';
import { LockIcon } from 'lucide-react';
import type { Locale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getCalendarDays, getWeekdayNames } from '../utils/helpers';
import {
  getPreviewRange,
  isAlternative,
  isBankHoliday as isBankHolidayFn,
  isCustom as isCustomFn,
  isHoliday,
  isInRange,
  isManuallySelected,
  isPast,
  isRangeEnd,
  isRangeSelected,
  isRangeStart,
  isSelected,
  isSuggestion,
  isToday,
} from '../utils/modifiers';
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
  manuallySelectedDays?: Date[];
  removedSuggestedDays?: Date[];
  onDayToggle?: (date: Date) => void;
  canSelectMoreDays?: boolean;
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
  manuallySelectedDays = [],
  removedSuggestedDays = [],
  onDayToggle,
  canSelectMoreDays = true,
  ...props
}: Readonly<CalendarProps>) {
  const t = useTranslations('toasts');
  const tPremium = useTranslations('premium');
  const tCalendar = useTranslations('calendar');
  const premiumKey = usePremiumStore((state) => state.premiumKey);
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
    const bankHolidayFn = isBankHolidayFn(holidays);
    const isPastFn = isPast(allowPastDays);
    const isSuggestionFn = isSuggestion(currentSelection, removedSuggestedDays);
    const isAlternativeFn = isAlternative({ alternatives, suggestion, previewAlternativeIndex, currentSelection });
    const isManuallySelectedFn = isManuallySelected(manuallySelectedDays);
    const isSelectedModifier =
      mode === CalendarSelectionMode.RANGE ? isRangeSelected(rangeSelection) : isSelected(selectedDates);

    const baseModifiers = {
      weekend: isWeekend,
      holiday: holidayFn,
      custom: customFn,
      bankHoliday: bankHolidayFn,
      today: isToday,
      suggested: isSuggestionFn,
      alternative: isAlternativeFn,
      disabled: isPastFn,
      selected: isSelectedModifier,
      manuallySelected: isManuallySelectedFn,
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
    manuallySelectedDays,
    removedSuggestedDays,
  ]);

  const weekdayNames = useMemo(() => getWeekdayNames({ locale, weekStartsOn }), [locale, weekStartsOn]);
  const monthYearLabel = useMemo(
    () => formatDate({ date: currentMonth, locale, format: 'LLLL yyyy' }),
    [currentMonth, locale]
  );
  const monthLabel = useMemo(() => formatDate({ date: currentMonth, locale, format: 'MMMM' }), [currentMonth, locale]);
  const yearLabel = useMemo(() => formatDate({ date: currentMonth, locale, format: 'yyyy' }), [currentMonth, locale]);
  const monthFreeDays = useMemo(
    () => holidays.filter((h) => isSameMonth(h.date, currentMonth) && h.isInSelectedRange).length,
    [holidays, currentMonth]
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
      if (disabled) return;

      if (mode === CalendarSelectionMode.NONE && onDayToggle) {
        const isPastDay = !allowPastDays && modifiers.disabled(date);
        const isManual = modifiers.manuallySelected(date);
        const isSuggested = modifiers.suggested(date);
        const isBankHoliday = modifiers.bankHoliday(date);
        if (!premiumKey) {
          toast.info(tPremium('premiumFeature'), {
            description: tPremium('unlockDescription'),
            duration: 7_500,
            classNames: {
              toast: 'flex flex-wrap items-center overflow-visible',
              icon: 'mt-0.5 shrink-0',
              content: 'flex-1',
            },
            icon: <LockIcon size='16' />,
            action: (
              <SupportButton
                label={tPremium('upgrade')}
                className='w-full py-3 px-2 !bg-[var(--color-brand-ink)] !text-white !border-transparent !shadow-[5px_5px_0_0_var(--color-brand-orange)] hover:!shadow-[7px_7px_0_0_var(--color-brand-orange)] active:!shadow-[1px_1px_0_0_var(--color-brand-orange)]'
              />
            ),
          });
          return;
        }
        if (isPastDay && !isManual && !isSuggested) {
          toast.warning(t('cannotSelectPastDays'), {
            description: t('enablePastDays'),
          });
          return;
        }

        if (isBankHoliday) {
          toast.warning(t('cannotSelectBankHoliday'), {
            description: t('bankHolidayDescription'),
          });
          return;
        }

        if (isManual || isSuggested) {
          onDayToggle(date);
          return;
        }

        if (canSelectMoreDays) {
          onDayToggle(date);
          return;
        }

        toast.warning(t('noPtoDaysRemaining'), {
          description: t('removeDaysToFree'),
        });
        return;
      }

      if (mode === CalendarSelectionMode.NONE) return;

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
    [
      disabled,
      mode,
      selectedDates,
      onSelect,
      rangeSelection,
      onDayToggle,
      allowPastDays,
      modifiers.disabled,
      modifiers.suggested,
      modifiers.manuallySelected,
      canSelectMoreDays,
      premiumKey,
      t,
      tPremium,
      modifiers.bankHoliday,
    ]
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

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    if (mode === CalendarSelectionMode.SINGLE) {
      setSelectedDates([today]);
      onSelect?.(today);
    }
  }, [mode, onSelect]);

  return (
    <div
      className={cn(
        'calendar-container w-fit select-none bg-card z-1 rounded-[14px] border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-md)] overflow-hidden [content-visibility:auto] [contain-intrinsic-block-size:340px]',
        className
      )}
      {...props}
    >
      <div className='flex items-center justify-between border-b-[3px] border-[var(--frame)] bg-[var(--surface-panel-alt)] px-3 py-2'>
        {showNavigation ? (
          <>
            <div className='flex items-center gap-3'>
              <AnimateIcon animateOnHover>
                <Button
                  variant='ghost'
                  type='button'
                  size='sm'
                  onClick={handlePreviousMonth}
                  className='h-8 w-8 p-0 bg-[var(--color-brand-yellow)] text-[var(--color-brand-ink)] border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-xs)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                  aria-label={tCalendar('previousMonth')}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
              </AnimateIcon>
              <h3 className='text-sm font-black'>
                {monthLabel} <span className='font-serif'>{yearLabel}</span>
              </h3>
            </div>
            <div className='flex items-center gap-2'>
              {monthFreeDays > 0 && (
                <span className='text-xs font-black text-muted-foreground tabular-nums'>
                  {tCalendar('daysOff', { count: monthFreeDays })}
                </span>
              )}
              <Button
                variant='ghost'
                type='button'
                size='sm'
                onClick={handleGoToToday}
                className='h-7 px-2 text-[10px] font-mono font-black uppercase tracking-[0.06em] border-[2px] border-[var(--frame)]/40 shadow-none hover:border-[var(--frame)] hover:bg-[var(--color-brand-yellow)] hover:text-[var(--color-brand-ink)]'
                aria-label={tCalendar('today')}
              >
                {tCalendar('today')}
              </Button>
              <AnimateIcon animateOnHover>
                <Button
                  variant='ghost'
                  type='button'
                  size='sm'
                  onClick={handleNextMonth}
                  className='h-8 w-8 p-0 bg-[var(--color-brand-yellow)] text-[var(--color-brand-ink)] border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-xs)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                  aria-label={tCalendar('nextMonth')}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </AnimateIcon>
            </div>
          </>
        ) : (
          <div className='flex items-center justify-between w-full'>
            <h3 className='text-sm font-black'>
              {monthLabel} <span className='font-serif'>{yearLabel}</span>
            </h3>
            {monthFreeDays > 0 && (
              <span className='text-xs font-black text-muted-foreground tabular-nums'>
                {tCalendar('daysOff', { count: monthFreeDays })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className='grid grid-cols-7 gap-1 mb-3 px-4 pt-3'>
        {weekdayNames.map((day) => (
          <div
            key={day}
            className='h-8 w-8 flex items-center justify-center text-[0.68rem] font-black uppercase tracking-[0.08em] text-muted-foreground'
          >
            {day}
          </div>
        ))}
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: role=grid on div is required for calendar ARIA pattern */}
      <div className='grid grid-cols-7 gap-2 px-4 pb-4' role='grid' aria-label={monthYearLabel}>
        {calendarDays.map((date) => {
          const isPastDay = modifiers.disabled(date);
          const isManualDay = modifiers.manuallySelected(date);
          const isSuggestedDay = modifiers.suggested(date);

          // In manual mode, allow clicking on suggested/manual days even if they're in the past
          const isDisabled = disabled ?? (isPastDay && !isManualDay && !isSuggestedDay);
          const isOutsideMonth = !isSameMonth(date, currentMonth);

          if (!showOutsideDays && isOutsideMonth) {
            return <div key={date.toISOString()} className='h-8 w-8' />;
          }

          const holidayName = holidaysMap.get(date.toDateString());

          const baseClasses = getDayClassNames({
            date,
            month: currentMonth,
            selectedDates: mode === CalendarSelectionMode.RANGE ? [] : selectedDates,
            disabled: isDisabled,
            showOutsideDays,
            allowPastDays,
            modifiers,
          });

          return (
            <div key={date.toISOString()} className='relative h-8 w-8 p-0'>
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
                  className={cn(baseClasses)}
                  variant='ghost'
                  onClick={() => handleDayClick(date)}
                  onMouseEnter={() => handleDayHover(date)}
                  onMouseLeave={handleDayLeave}
                  disabled={isDisabled}
                  aria-label={
                    holidayName
                      ? `${formatDate({ date, locale, format: 'EEEE, MMMM d, yyyy' })}, ${holidayName}`
                      : formatDate({ date, locale, format: 'EEEE, MMMM d, yyyy' })
                  }
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
