'use client';

import { type DependencyList, useCallback, useLayoutEffect, useRef, useState } from 'react';

const borderBoxExtra = (element: HTMLElement) => {
  const style = getComputedStyle(element);

  if (style.boxSizing !== 'border-box') return 0;

  const paddingY =
    (Number.parseFloat(style.paddingTop || '0') || 0) + (Number.parseFloat(style.paddingBottom || '0') || 0);
  const borderY =
    (Number.parseFloat(style.borderTopWidth || '0') || 0) + (Number.parseFloat(style.borderBottomWidth || '0') || 0);

  return paddingY + borderY;
};

export function useAutoHeight<T extends HTMLElement = HTMLDivElement>(deps: DependencyList = []) {
  const ref = useRef<T | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(0);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return 0;

    const base = el.getBoundingClientRect().height || 0;
    const extra = el.parentElement ? borderBoxExtra(el.parentElement) : 0;
    const dpr = globalThis.window === undefined ? 1 : window.devicePixelRatio || 1;

    return Math.ceil((base + extra) * dpr) / dpr;
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    setHeight(measure());

    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }

    const ro = new ResizeObserver(() => {
      const next = measure();
      requestAnimationFrame(() => setHeight(next));
    });

    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);

    roRef.current = ro;

    return () => {
      ro.disconnect();
      roRef.current = null;
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: props intentionally omitted to avoid stale closure on every render
  }, deps);

  useLayoutEffect(() => {
    if (height === 0) {
      const next = measure();
      if (next !== 0) setHeight(next);
    }
  }, [height, measure]);

  return { ref, height } as const;
}
