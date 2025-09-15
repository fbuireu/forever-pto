import { isBefore, isSameDay, isSameMonth, startOfDay } from 'date-fns';

interface GetDayClassNamesParams {
  date: Date;
  month: Date;
  selectedDates: Date[];
  disabled?: boolean;
  showOutsideDays: boolean;
  allowPastDays?: boolean;
  modifiers: Record<string, (date: Date) => boolean>;
}

export const MODIFIERS_CLASS_NAMES: Record<string, string> = {
  weekend: 'text-muted-foreground bg-muted/50 hover:bg-muted transition-colors ring-2 ring-border',
  holiday:
    'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-500 hover:to-yellow-600 font-semibold shadow-sm transition-[background-color,box-shadow] duration-200 ring-2 ring-yellow-200 dark:ring-yellow-300',
  suggested:
    'bg-teal-400 dark:bg-teal-600 hover:bg-teal-500 dark:hover:bg-teal-700 ring-2 ring-teal-300 dark:ring-teal-400 text-white font-semibold transition-[background-color,box-shadow] duration-200 shadow-md',
  alternative:
    'bg-orange-100 dark:bg-orange-900/30 text-white font-semibold animate-pulse shadow-md ring-2 ring-orange-300 dark:ring-orange-400 transition-[background-color,box-shadow,opacity] duration-200 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_2px,rgba(255,165,0,0.8)_2px,rgba(255,165,0,0.8)_4px)]',
  custom:
    'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 font-semibold shadow-md ring-2 ring-purple-300 dark:ring-purple-400 transition-[background-color,box-shadow,opacity] duration-200 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_2px,rgba(147,51,234,0.8)_2px,rgba(147,51,234,0.8)_4px)]',
  selected:
    'bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary font-semibold shadow-md transition-[background-color,box-shadow] duration-200',
  today:
    'bg-slate-400 dark:bg-slate-500 hover:bg-slate-500 dark:hover:bg-slate-700 text-white font-semibold shadow-md ring-2 ring-slate-300 dark:ring-slate-400 ring-offset-1 ring-offset-background transition-[background-color,box-shadow] duration-200',
} as const;

export const getDayClassNames = ({
  date,
  month,
  selectedDates,
  disabled = false,
  showOutsideDays,
  allowPastDays = true,
  modifiers,
}: GetDayClassNamesParams): string => {
  const classes: string[] = [];
  const isOutsideMonth = !isSameMonth(date, month);
  const isSelected = selectedDates.some((d) => isSameDay(d, date));

  const today = startOfDay(new Date());
  const isPastDay = isBefore(startOfDay(date), today);
  const shouldShowAsPast = isPastDay && !allowPastDays;

  classes.push(
    'h-8 w-8 p-0 font-normal text-sm',
    'focus-visible:ring-1 focus-visible:ring focus-visible:ring-offset-2 transition-colors'
  );

  const isTodayActive = modifiers.today?.(date);

  if (!disabled && !isSelected) {
    if (isTodayActive) {
      classes.push(MODIFIERS_CLASS_NAMES.today);
    } else {
      Object.entries(modifiers).forEach(([name, modifierFn]) => {
        if (modifierFn?.(date) && MODIFIERS_CLASS_NAMES[name]) {
          classes.push(MODIFIERS_CLASS_NAMES[name]);
        }
      });
    }
  }

  if (isSelected && !disabled) {
    classes.push(MODIFIERS_CLASS_NAMES.selected);
  }

  if (disabled) {
    const opacity = isOutsideMonth ? '!opacity-20' : '!opacity-40';
    classes.push(opacity, 'cursor-not-allowed pointer-events-none text-muted-foreground');
  } else {
    const outsideMonthClass = showOutsideDays ? 'text-muted-foreground opacity-50' : 'invisible';

    if (isOutsideMonth) {
      classes.push(outsideMonthClass);
    } else if (shouldShowAsPast) {
      classes.push('text-muted-foreground opacity-50');
    }

    if (!isSelected && !modifiers.today?.(date)) {
      classes.push('hover:bg-accent hover:text-accent-foreground');
    }
  }

  return classes.join(' ');
};
