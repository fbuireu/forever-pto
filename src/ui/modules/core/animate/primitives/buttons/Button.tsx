'use client';

import { type HTMLMotionProps, m } from 'motion/react';
import type React from 'react';
import { MotionSlot, type WithAsChild } from '../animate/MotionSlot';

type ButtonProps = WithAsChild<
  HTMLMotionProps<'button'> & {
    animated?: boolean;
  }
>;

function Button({ animated = true, asChild = false, children, ...props }: ButtonProps) {
  const motionProps = animated
    ? ({
        whileHover: { x: -2, y: -2, boxShadow: '7px 7px 0 0 var(--frame)' },
        whileTap: { x: 2, y: 2, boxShadow: '1px 1px 0 0 var(--frame)' },
        transition: { type: 'spring', stiffness: 500, damping: 25 },
      } as const)
    : {};

  if (asChild) {
    return (
      <MotionSlot {...motionProps} {...props}>
        {children as React.ReactElement}
      </MotionSlot>
    );
  }
  return (
    <m.button {...motionProps} {...props}>
      {children}
    </m.button>
  );
}

export { Button, type ButtonProps };
