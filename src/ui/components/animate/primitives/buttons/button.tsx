'use client';

import { type HTMLMotionProps, m } from 'motion/react';
import type React from 'react';
import { Slot, type WithAsChild } from '../animate/slot';

type ButtonProps = WithAsChild<
  HTMLMotionProps<'button'> & {
    hoverScale?: number;
    tapScale?: number;
  }
>;

function Button({ hoverScale = 1.05, tapScale = 1, asChild = false, children, ...props }: ButtonProps) {
  const motionProps = {
    whileTap: { scale: tapScale },
    whileHover: { scale: hoverScale },
    transition: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 },
  } as const;

  if (asChild) {
    return (
      <Slot {...motionProps} {...props}>
        {children as React.ReactElement}
      </Slot>
    );
  }
  return (
    <m.button {...motionProps} {...props}>
      {children}
    </m.button>
  );
}

export { Button, type ButtonProps };
