'use client';

import { type UseIsInViewOptions, useIsInView } from '@ui/hooks/useIsInView';
import { getStrictContext } from '@ui/utils/context';
import { type ComponentProps, type Ref, useEffect, useMemo, useState } from 'react';

type RotatingTextContextType = {
  currentText: string;
  y: number;
  isInView: boolean;
};

const [RotatingTextProvider] = getStrictContext<RotatingTextContextType>('RotatingTextContext');

type RotatingTextContainerProps = ComponentProps<'div'> & {
  text: string | string[];
  duration?: number;
  y?: number;
  delay?: number;
} & UseIsInViewOptions;

function RotatingTextContainer({
  ref,
  text,
  y = -50,
  duration = 2000,
  delay = 0,
  style,
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  ...props
}: RotatingTextContainerProps) {
  const [index, setIndex] = useState(0);

  const { ref: localRef, isInView } = useIsInView(ref as Ref<HTMLDivElement>, {
    inView,
    inViewOnce,
    inViewMargin,
  });

  useEffect(() => {
    if (!Array.isArray(text)) return;
    if (inView && !isInView) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const timeoutId = setTimeout(() => {
      setIndex((prev) => (prev + 1) % text.length);
      intervalId = setInterval(() => setIndex((prev) => (prev + 1) % text.length), duration);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, duration, delay, inView, isInView]);

  const currentText = Array.isArray(text) ? text[index] : text;

  const contextValue = useMemo(() => ({ currentText, y, isInView }), [currentText, y, isInView]);

  return (
    <RotatingTextProvider value={contextValue}>
      <div
        ref={localRef}
        style={{
          overflow: 'hidden',
          paddingBlock: '0.25rem',
          ...style,
        }}
        {...props}
      />
    </RotatingTextProvider>
  );
}

export { RotatingTextContainer };
