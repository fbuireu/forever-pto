import { isSameDay, isSameMonth } from 'date-fns';

interface GetDayClassNamesParams {
  date: Date;
  month: Date;
  selectedDates: Date[];
  disabled?: (date: Date) => boolean;
  showOutsideDays: boolean;
  modifiers: Record<string, (date: Date) => boolean>;
}

const MODIFIERS_CLASS_NAMES: Record<string, string> = {
  weekend: 'text-muted-foreground bg-muted/50 hover:bg-muted transition-colors',
  holiday:
    'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-500 hover:to-yellow-600 font-semibold shadow-sm transition-bg duration-200 ring-2 ring-yellow-200 dark:ring-yellow-300',
  suggested:
    'bg-teal-400 dark:bg-teal-600 hover:bg-teal-500 dark:hover:bg-teal-700 ring-2 ring-teal-300 dark:ring-teal-400 text-white font-semibold transition-b duration-200 shadow-md',
  today: 'bg-accent text-accent-foreground font-medium ring-2 ring-ring',
  alternative:
    'bg-orange-100 dark:bg-orange-900/30 text-white font-semibold animate-pulse shadow-md ring-2 ring-orange-300 dark:ring-orange-400 transition-all duration-200 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_2px,rgba(255,165,0,0.8)_2px,rgba(255,165,0,0.8)_4px)]',
} as const;

export const getDayClassNames = ({
  date,
  month,
  selectedDates,
  disabled,
  showOutsideDays,
  modifiers,
}: GetDayClassNamesParams): string => {
  const classes = [];
  const isDisabled = disabled?.(date);
  const isOutsideMonth = !isSameMonth(date, month);
  const isSelected = selectedDates.some((d) => isSameDay(d, date));
  const isSelectedAndEnabled = isSelected && !isDisabled;

  classes.push(
    'h-8 w-8 p-0 font-normal text-sm',
    'focus-visible:ring-1 focus-visible:ring focus-visible:ring-offset-2 transition-colors'
  );

  Object.entries(modifiers).forEach(([name, modifierFn]) => {
    const shouldApplyModifier =
      modifierFn?.(date) && MODIFIERS_CLASS_NAMES[name] && !(name === 'today' && (isDisabled || isSelected));
    if (shouldApplyModifier) {
      classes.push(MODIFIERS_CLASS_NAMES[name]);
    }
  });

  if (isSelectedAndEnabled) {
    // classes.push('bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground');
  }

  if (isDisabled) {
    const opacity = isOutsideMonth ? '!opacity-20' : '!opacity-40';
    classes.push(opacity, 'cursor-not-allowed pointer-events-none text-muted-foreground');
  } else {
    const outsideMonthClass = showOutsideDays ? 'text-muted-foreground opacity-50' : 'invisible';
    if (isOutsideMonth) {
      classes.push(outsideMonthClass);
    }

    if (!isSelected) {
      classes.push('hover:bg-accent hover:text-accent-foreground');
    }
  }

  return classes.join(' ');
};
