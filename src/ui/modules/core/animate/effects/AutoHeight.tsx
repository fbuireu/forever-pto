'use client';

import {
  motion,
  type HTMLMotionProps,
  type LegacyAnimationControls,
  type TargetAndTransition,
  type Transition,
} from 'motion/react';
import * as React from 'react';
import { useAutoHeight } from 'src/ui/hooks/useAutoHeight';
import { Slot } from '../base/Slot';
import { WithAsChild } from '../primitives/animate/MotionSlot';

type AutoHeightProps = WithAsChild<
  {
    children: React.ReactNode;
    deps?: React.DependencyList;
    animate?: TargetAndTransition | LegacyAnimationControls;
    transition?: Transition;
  } & Omit<HTMLMotionProps<'div'>, 'animate'>
>;

function AutoHeight({
  children,
  deps = [],
  transition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    bounce: 0,
    restDelta: 0.01,
  },
  style,
  animate,
  asChild = false,
  ...props
}: AutoHeightProps) {
  const { ref, height } = useAutoHeight<HTMLDivElement>(deps);

  const Component = asChild ? Slot : motion.div;

  return (
    <Component style={{ overflow: 'hidden', ...style }} animate={{ height, ...animate }} transition={transition} {...props}>
      <div ref={ref}>{children}</div>
    </Component>
  );
}

export { AutoHeight, type AutoHeightProps };
