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

export const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const dayCell: Record<DayType, string> = {
  work: 'bg-card border-[2px] border-[var(--frame)] rounded-[5px]',
  holiday: 'bg-[var(--color-brand-orange)] text-white border-[2px] border-[var(--frame)] rounded-[5px]',
  pto: 'bg-[var(--color-brand-teal)] text-white border-[2px] border-[var(--frame)] rounded-[5px]',
  weekend: 'bg-[var(--surface-panel-soft)] text-muted-foreground border-[2px] border-[var(--frame)] rounded-[5px]',
};

export const brutCard = 'bg-card border-[4px] border-[var(--frame)] rounded-[14px] shadow-[var(--shadow-brutal-md)]';
