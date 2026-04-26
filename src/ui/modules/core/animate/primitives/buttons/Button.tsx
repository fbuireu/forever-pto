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
        whileHover: { x: -2, y: -2 },
        whileTap: { x: 2, y: 2 },
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
