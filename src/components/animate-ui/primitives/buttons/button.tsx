'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import { Slot, type WithAsChild } from '../animate/slot';

type ButtonProps = WithAsChild<
  HTMLMotionProps<'button'> & {
    hoverScale?: number;
    tapScale?: number;
  }
>;

function Button({ hoverScale = 1.05, tapScale = 1, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : motion.button;

  return (
    <Component
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: hoverScale }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8,
      }}
      {...props}
    />
  );
}

export { Button, type ButtonProps };
