import { brutCard, CAL_ENTRIES, type DayType, dayCell } from '@ui/modules/pages/homepage/sections/shared';
import { Demo } from '../Demo';
import type { VariantRow } from '../VariantsTable';

// Exhaustive Record over the app's DayType union: adding, renaming or removing
// a day type in shared.ts makes `astro check` fail here, keeping the docs honest.
const DAY_LABELS: Record<DayType, string> = {
  work: 'Work day',
  holiday: 'Public holiday',
  pto: 'PTO day',
  weekend: 'Weekend',
};

const DAY_TYPES = Object.keys(DAY_LABELS) as DayType[];

export const DAY_TYPE_ROWS: VariantRow[] = [
  {
    axis: 'DayType',
    values: DAY_TYPES,
    notes: 'Cell class strings live in dayCell — imported here, never copied.',
  },
];

export const BrutCardDemo = () => (
  <Demo>
    <div className={`${brutCard} max-w-sm p-6`}>
      <h3 className='font-display text-lg font-black'>brutCard</h3>
      <p className='mt-1 text-sm text-muted-foreground'>
        The homepage marketing card: same recipe as the core Card, but framed with a deliberately heavier 4px border so
        marketing sections read louder than the app itself.
      </p>
    </div>
  </Demo>
);

export const DayCellsDemo = () => (
  <Demo>
    <div className='flex flex-col gap-6'>
      <div className='grid w-full max-w-xs grid-cols-7 gap-1.5'>
        {CAL_ENTRIES.map(({ id, type }, index) => (
          <div
            key={id}
            className={`${dayCell[type]} flex aspect-square items-center justify-center text-[11px] font-semibold`}
          >
            {index + 1}
          </div>
        ))}
      </div>
      <div className='flex flex-wrap gap-x-4 gap-y-2'>
        {DAY_TYPES.map((type) => (
          <span key={type} className='flex items-center gap-2 text-sm'>
            <span className={`${dayCell[type]} inline-block size-5`} />
            {DAY_LABELS[type]}
          </span>
        ))}
      </div>
    </div>
  </Demo>
);
