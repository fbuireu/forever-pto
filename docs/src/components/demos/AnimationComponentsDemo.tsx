import { Counter } from '@ui/modules/core/animate/components/Counter';
import { FeatureList } from '@ui/modules/core/animate/components/FeatureList';
import { RadialNav, type RadialNavProps } from '@ui/modules/core/animate/components/RadialNav';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Calendar, Settings, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { Demo } from '../Demo';

export const CounterDemo = () => {
  const [days, setDays] = useState(23);

  return (
    <LazyMotionProvider>
      <Demo>
        <Counter number={days} setNumber={setDays} label='PTO days' />
      </Demo>
    </LazyMotionProvider>
  );
};

const FEATURES = [
  {
    id: 'carryover',
    title: 'Carryover months',
    description: 'Stretch unused PTO into the first months of the next year.',
    quarter: 'Q1',
  },
  {
    id: 'custom-weekends',
    title: 'Custom weekends',
    description: 'Support working patterns other than Monday to Friday.',
    quarter: 'Q2',
  },
  {
    id: 'calendar-subscription',
    title: 'Calendar subscription',
    description: 'Subscribe to your optimized plan from any calendar app.',
    quarter: 'Q3',
  },
];

export const FeatureListDemo = () => (
  <LazyMotionProvider>
    <Demo>
      <div className='w-full max-w-sm'>
        <FeatureList features={FEATURES} categoryLabel='Roadmap' detailedViewLabel='Detailed view' />
      </div>
    </Demo>
  </LazyMotionProvider>
);

// Typed against the real component props so an API change in RadialNav
// breaks `astro check` here. Ids must be sequential and 1-based: the pointer
// looks the active item up by `items[activeId - 1]`.
const NAV_ITEMS: RadialNavProps['items'] = [
  { id: 1, icon: Calendar, label: 'Calendar', angle: 0 },
  { id: 2, icon: Star, label: 'Favorites', angle: 90, badgeClass: 'bg-[var(--color-brand-teal)]' },
  { id: 3, icon: Settings, label: 'Settings', angle: 180 },
  { id: 4, icon: Users, label: 'Team', angle: 270 },
];

export const RadialNavDemo = () => (
  <LazyMotionProvider>
    <Demo>
      <div className='mx-auto px-24 py-14'>
        <RadialNav items={NAV_ITEMS} defaultActiveId={1} />
      </div>
    </Demo>
  </LazyMotionProvider>
);
