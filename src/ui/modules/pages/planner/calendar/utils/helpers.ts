import { isBefore, isSameDay, isSameMonth, startOfDay } from '@ui/utils/dates';
import type { FromTo } from '../Calendar';

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
  weekend:
    'text-muted-foreground bg-[var(--surface-panel-soft)] hover:bg-[var(--surface-panel-alt)] transition-colors border-[2px] border-[var(--frame)]/15 shadow-[var(--shadow-brutal-xs)]',
  holiday:
    'bg-[linear-gradient(135deg,var(--color-brand-yellow),#facc15)] text-[var(--color-brand-ink)] hover:brightness-105 font-black transition-[background-color,box-shadow] duration-200 border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)]',
  suggested:
    'bg-[var(--color-brand-teal)] hover:brightness-105 text-[var(--color-brand-ink)] font-black transition-[background-color,box-shadow] duration-200 border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)]',
  alternative:
    'bg-[color-mix(in_srgb,var(--color-brand-orange)_32%,white_68%)] text-[var(--color-brand-ink)] font-black animate-pulse border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] transition-[background-color,box-shadow,opacity] duration-200 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(249,115,22,0.65)_4px,rgba(249,115,22,0.65)_8px)]',
  custom:
    'bg-[color-mix(in_srgb,var(--color-brand-purple)_28%,white_72%)] text-[var(--color-brand-ink)] font-black border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] transition-[background-color,box-shadow,opacity] duration-200 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(168,85,247,0.62)_4px,rgba(168,85,247,0.62)_8px)]',
  manuallySelected:
    'bg-[color-mix(in_srgb,var(--color-brand-purple)_18%,var(--color-brand-teal)_82%)] text-[var(--color-brand-paper)] font-black border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] transition-[background-color,box-shadow,opacity] duration-200 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.24)_4px,rgba(255,255,255,0.24)_8px)]',
  selected:
    'bg-primary text-primary-foreground hover:bg-primary/90 font-black border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] transition-[background-color,box-shadow] duration-200',
  today:
    'bg-[var(--color-brand-ink)] hover:brightness-105 text-[var(--color-brand-paper)] font-black border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] ring-offset-1 ring-offset-background transition-[background-color,box-shadow] duration-200',
  inRange: 'bg-primary/12',
  rangeStart: 'bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-[0.8rem]',
  rangeEnd: 'bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-[0.8rem]',
  previewRange: 'bg-primary/10',
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
    'h-8 w-8 rounded-[0.8rem] p-0 font-medium text-sm',
    'focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors'
  );

  const isTodayActive = modifiers.today?.(date);

  const isInRangeDay = modifiers.inRange?.(date);
  const isRangeStartDay = modifiers.rangeStart?.(date);
  const isRangeEndDay = modifiers.rangeEnd?.(date);

  if (!disabled && !isSelected) {
    if (isTodayActive) {
      classes.push(MODIFIERS_CLASS_NAMES.today);
    } else {
      Object.entries(modifiers).forEach(([name, modifierFn]) => {
        if (
          modifierFn?.(date) &&
          MODIFIERS_CLASS_NAMES[name] &&
          !['inRange', 'rangeStart', 'rangeEnd'].includes(name)
        ) {
          classes.push(MODIFIERS_CLASS_NAMES[name]);
        }
      });
    }
  }

  if (isInRangeDay && !isSelected && !disabled) {
    classes.push(MODIFIERS_CLASS_NAMES.inRange);
  }
  if (isRangeStartDay && !disabled) {
    classes.push(MODIFIERS_CLASS_NAMES.rangeStart);
  }
  if (isRangeEndDay && !disabled) {
    classes.push(MODIFIERS_CLASS_NAMES.rangeEnd);
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
      classes.push('text-muted-foreground opacity-60');
    }

    if (!isSelected && !modifiers.today?.(date) && !isRangeStartDay && !isRangeEndDay) {
      classes.push(
        'hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--shadow-brutal-xs)]'
      );
    }
  }

  return classes.join(' ');
};

export function getViewBoxFromSvg(svg: string): string {
  const VIEWBOX_REGEX = /viewBox="([^"]*)"/;
  const DEFAULT_VIEWBOX = '0 0 24 24';
  const viewBoxMatch = RegExp(VIEWBOX_REGEX).exec(svg);

  return viewBoxMatch ? viewBoxMatch[1] : DEFAULT_VIEWBOX;
}

export const isFromToObject = (obj: unknown): obj is FromTo => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    obj !== undefined &&
    'from' in obj &&
    'to' in obj &&
    (obj as FromTo).from instanceof Date &&
    (obj as FromTo).to instanceof Date
  );
};
