'use client';

import { type HTMLMotionProps, motion, type TargetAndTransition } from 'motion/react';
import type * as React from 'react';
import { useAutoHeight } from 'src/ui/hooks/useAutoHeight';
import { MotionSlot, type WithAsChild } from '../primitives/animate/MotionSlot';

type AutoHeightProps = WithAsChild<
  {
    children: React.ReactNode;
    deps?: React.DependencyList;
  } & Omit<HTMLMotionProps<'div'>, 'children'>
>;

function isTargetAnimation(animate: HTMLMotionProps<'div'>['animate']): animate is TargetAndTransition {
  return typeof animate === 'object' && animate !== null && !Array.isArray(animate) && !('start' in animate);
}

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
  className,
  style,
  animate,
  asChild = false,
  ...props
}: AutoHeightProps) {
  const { ref, height } = useAutoHeight<HTMLDivElement>(deps);
  const mergedAnimate = isTargetAnimation(animate) ? { height, ...animate } : { height };

  const content = <div ref={ref}>{children}</div>;

  if (asChild) {
    return (
      <MotionSlot className={className} style={style} animate={mergedAnimate} transition={transition} {...props}>
        {content}
      </MotionSlot>
    );
  }

  return (
    <motion.div className={className} style={style} animate={mergedAnimate} transition={transition} {...props}>
      {content}
    </motion.div>
  );
}

export { AutoHeight, type AutoHeightProps };
