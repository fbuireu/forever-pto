import { isSameDay, isSameMonth } from 'date-fns';

interface GetDayClassNamesParams {
  date: Date;
  month: Date;
  selectedDates: Date[];
  disabled?: (date: Date) => boolean;
  showOutsideDays: boolean;
  modifiers: Record<string, (date: Date) => boolean>;
  modifiersClassNames: Record<string, string>;
}
export const getDayClassNames = ({
  date,
  month,
  selectedDates,
  disabled,
  showOutsideDays,
  modifiers,
  modifiersClassNames,
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
      modifierFn?.(date) && modifiersClassNames[name] && !(name === 'today' && (isDisabled || isSelected));
    if (shouldApplyModifier) {
      classes.push(modifiersClassNames[name]);
    }
  });

  if (isSelectedAndEnabled) {
    // classes.push('bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground');

    if (modifiers.today?.(date)) {
      classes.push('ring-2 ring-ring ring-offset-2');
    }
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
