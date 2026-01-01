'use client';

import { useEffect, useRef, useState } from 'react';

const POSITION_TOLERANCE_PX = 2;

export const useStickyState = <T extends HTMLElement>(): [
  React.RefObject<T | null>,
  boolean,
] => {
  const [isStuck, setIsStuck] = useState(false);
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const parent = element.parentElement;
    if (!parent) return;

    const checkSticky = () => {
      const rect = element.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const bottomValue = Number.parseInt(getComputedStyle(element).bottom ?? '0');

      const isAtBottom = Math.abs(rect.bottom - viewportHeight + bottomValue) < POSITION_TOLERANCE_PX;
      const hasContentAbove = parentRect.top < rect.top - 100;

      setIsStuck(isAtBottom && hasContentAbove);
    };

    const observer = new IntersectionObserver(checkSticky, {
      threshold: [0, 0.1, 0.5, 1],
      rootMargin: '0px',
    });

    observer.observe(element);

    window.addEventListener('scroll', checkSticky, { passive: true });
    checkSticky();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', checkSticky);
    };
  }, []);

  return [elementRef, isStuck];
};
