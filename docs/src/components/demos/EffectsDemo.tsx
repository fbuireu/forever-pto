import { AutoHeight } from '@ui/modules/core/animate/effects/AutoHeight';
import { MotionHighlight, MotionHighlightItem } from '@ui/modules/core/animate/effects/MotionHighlight';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Button } from '@ui/modules/core/primitives/Button';
import { useState } from 'react';
import { Demo } from '../Demo';

const STRATEGIES = ['Grouped', 'Optimized', 'Balanced'];

export const MotionHighlightChildrenDemo = () => (
  <LazyMotionProvider>
    <Demo>
      <MotionHighlight hover className='rounded-lg border-2 border-[var(--frame)] bg-accent'>
        {STRATEGIES.map((label) => (
          <button key={label} type='button' className='cursor-pointer px-4 py-2 text-sm font-semibold'>
            {label}
          </button>
        ))}
      </MotionHighlight>
    </Demo>
  </LazyMotionProvider>
);

const TABS = [
  { value: 'calendar', label: 'Calendar' },
  { value: 'summary', label: 'Summary' },
  { value: 'charts', label: 'Charts' },
];

export const MotionHighlightParentDemo = () => {
  const [active, setActive] = useState<string | null>('calendar');

  return (
    <LazyMotionProvider>
      <Demo>
        <MotionHighlight
          mode='parent'
          controlledItems
          value={active}
          onValueChange={setActive}
          className='rounded-lg border-2 border-[var(--frame)] bg-accent'
          containerClassName='flex gap-1 rounded-xl border-[3px] border-[var(--frame)] bg-[var(--surface-panel-soft)] p-1'
        >
          {TABS.map(({ value, label }) => (
            <MotionHighlightItem key={value} value={value}>
              <button type='button' className='cursor-pointer px-4 py-1.5 text-sm font-semibold'>
                {label}
              </button>
            </MotionHighlightItem>
          ))}
        </MotionHighlight>
      </Demo>
    </LazyMotionProvider>
  );
};

const SHORT_TEXT = 'Pick a country and a number of PTO days.';
const LONG_TEXT =
  'Pick a country and a number of PTO days. The optimizer then scans the public holiday calendar, finds bridge days between holidays and weekends, and suggests the placement that turns the fewest PTO days into the longest continuous breaks.';

export const AutoHeightDemo = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <LazyMotionProvider>
      <Demo>
        <div className='flex flex-col items-start gap-3'>
          <Button size='sm' variant='outline' onClick={() => setExpanded((previous) => !previous)}>
            Toggle content
          </Button>
          <AutoHeight
            deps={[expanded]}
            className='w-80 overflow-hidden rounded-xl border-[3px] border-[var(--frame)] bg-card shadow-[var(--shadow-brutal-xs)]'
          >
            <p className='p-4 text-sm'>{expanded ? LONG_TEXT : SHORT_TEXT}</p>
          </AutoHeight>
        </div>
      </Demo>
    </LazyMotionProvider>
  );
};
