export type DayType = 'work' | 'holiday' | 'pto' | 'weekend';

const CAL_PATTERN: DayType[] = [
  'work',
  'work',
  'work',
  'holiday',
  'pto',
  'weekend',
  'weekend',
  'work',
  'work',
  'work',
  'work',
  'work',
  'weekend',
  'weekend',
  'holiday',
  'pto',
  'work',
  'work',
  'work',
  'weekend',
  'weekend',
  'work',
  'work',
  'work',
  'pto',
  'holiday',
  'weekend',
  'weekend',
];

export const CAL_ENTRIES = CAL_PATTERN.map((type, i) => ({ id: `d${i + 1}`, type }));

const _DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const dayCell: Record<DayType, string> = {
  work: 'rounded-lg bg-card text-foreground border-[2px] border-[var(--frame)]/15',
  holiday:
    'rounded-lg bg-[linear-gradient(135deg,var(--color-brand-yellow),#facc15)] text-[var(--color-brand-ink)] font-black border-[2px] border-[var(--frame)]',
  pto: 'rounded-lg bg-[var(--color-brand-teal)] text-[var(--color-brand-ink)] font-black border-[2px] border-[var(--frame)]',
  weekend: 'rounded-lg bg-[var(--surface-panel-soft)] text-muted-foreground border-[2px] border-[var(--frame)]/15',
};

export const brutCard =
  'bg-card border-[4px] border-[var(--frame)] rounded-[14px] shadow-[var(--shadow-brutal-md)] [contain:layout]';
