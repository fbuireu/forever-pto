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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.target) return;

        const rect = entry.target.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const bottomValue = Number.parseInt(getComputedStyle(element).bottom || '0');
        const isAtBottom = Math.abs(rect.bottom - viewportHeight + bottomValue) < POSITION_TOLERANCE_PX;
        const parentHasScrolledContent = parentRect.top < 0;

        setIsStuck(isAtBottom && parentHasScrolledContent);
      },
      {
        threshold: [0, 0.1, 0.5, 1],
        rootMargin: '0px',
      }
    );

    observer.observe(element);

    const handleScroll = () => {
      if (!element || !parent) return;

      const rect = element.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const bottomValue = Number.parseInt(getComputedStyle(element).bottom || '0');
      const isAtBottom = Math.abs(rect.bottom - viewportHeight + bottomValue) < POSITION_TOLERANCE_PX;
      const parentHasScrolledContent = parentRect.top < 0;

      setIsStuck(isAtBottom && parentHasScrolledContent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return [elementRef, isStuck];
};
