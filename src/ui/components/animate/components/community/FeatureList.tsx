'use client';

import { Badge } from '@ui/components/primitives/badge';
import { m, type Transition } from 'motion/react';

interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  quarter?: string;
}

interface FeatureListProps {
  features: RoadmapFeature[];
  categoryLabel: string;
}

const transition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 26,
};

const getCardVariants = (i: number) => ({
  collapsed: {
    marginTop: i === 0 ? 0 : -44,
    scaleX: 1 - i * 0.05,
  },
  expanded: {
    marginTop: i === 0 ? 0 : 16,
    scaleX: 1,
  },
});

const textSwitchTransition: Transition = {
  duration: 0.22,
  ease: 'easeInOut',
};

const categoryTextVariants = {
  collapsed: { opacity: 1, y: 0, pointerEvents: 'auto' },
  expanded: { opacity: 0, y: -16, pointerEvents: 'none' },
};

const viewAllTextVariants = {
  collapsed: { opacity: 0, y: 16, pointerEvents: 'none' },
  expanded: { opacity: 1, y: 0, pointerEvents: 'auto' },
};

export function FeatureList({ features, categoryLabel }: FeatureListProps) {
  return (
    <m.div
      className='bg-card border-[3px] border-[var(--frame)] rounded-[14px] p-4 w-full space-y-3 shadow-[var(--shadow-brutal-md)]'
      initial='collapsed'
      whileHover='expanded'
      whileTap='expanded'
    >
      <div>
        {features.map((feature, i) => (
          <m.div
            key={feature.id}
            className='border-[3px] border-[var(--frame)] bg-[var(--surface-panel-soft)] rounded-[10px] px-4 py-3 relative'
            variants={getCardVariants(i)}
            transition={transition}
            style={{
              zIndex: features.length - i,
            }}
          >
            <div className='flex justify-between items-start gap-4'>
              <div className='flex-1 space-y-1'>
                <h3 className='text-sm font-semibold'>{feature.title}</h3>
                <p className='text-xs text-muted-foreground line-clamp-2'>{feature.description}</p>
              </div>
              {feature.quarter && (
                <Badge variant='secondary' className='shrink-0 text-xs'>
                  {feature.quarter}
                </Badge>
              )}
            </div>
          </m.div>
        ))}
      </div>

      <div className='flex items-center gap-2'>
        <div className='size-6 rounded-full border-[2px] border-[var(--frame)] bg-[var(--accent)] text-foreground text-xs flex items-center justify-center font-black'>
          {features.length}
        </div>
        <span className='grid'>
          <m.span
            className='text-sm font-medium text-foreground row-start-1 col-start-1'
            variants={categoryTextVariants}
            transition={textSwitchTransition}
          >
            {categoryLabel}
          </m.span>
          <m.span
            className='text-sm font-medium text-foreground flex items-center gap-1 cursor-pointer select-none row-start-1 col-start-1'
            variants={viewAllTextVariants}
            transition={textSwitchTransition}
          >
            Detailed view
          </m.span>
        </span>
      </div>
    </m.div>
  );
}
