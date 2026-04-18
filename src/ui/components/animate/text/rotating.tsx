'use client';

import { cn } from '@ui/lib/utils';
import { AnimatePresence, type HTMLMotionProps, m, type Transition } from 'motion/react';
import { useEffect, useState } from 'react';

type RotatingTextProps = {
  text: string | string[];
  duration?: number;
  transition?: Transition;
  y?: number;
  containerClassName?: string;
} & HTMLMotionProps<'div'>;

function RotatingText({
  text,
  y = -50,
  duration = 2000,
  transition = { duration: 0.3, ease: 'easeOut' },
  containerClassName,
  ...props
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!Array.isArray(text)) return;

    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % text.length);
    }, duration);

    return () => clearInterval(interval);
  }, [text, duration]);

  const currentText = Array.isArray(text) ? text[index] : text;

  return (
    <div className={cn('overflow-hidden py-1', containerClassName)}>
      <AnimatePresence mode='wait'>
        <m.div
          key={currentText}
          transition={transition}
          initial={{ opacity: 0, y: -y }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y }}
          {...props}
        >
          {currentText}
        </m.div>
      </AnimatePresence>
    </div>
  );
}

export { RotatingText, type RotatingTextProps };
