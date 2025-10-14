import { useInView, type UseInViewOptions } from 'motion/react';
import { useRef, useImperativeHandle } from 'react';

export interface UseIsInViewOptions {
  inView?: boolean;
  inViewOnce?: boolean;
  inViewMargin?: UseInViewOptions['margin'];
}

export function useIsInView<T extends HTMLElement = HTMLElement>(ref: React.Ref<T>, options: UseIsInViewOptions = {}) {
  const { inView, inViewOnce = false, inViewMargin = '0px' } = options;
  const localRef = useRef<T>(null);
  useImperativeHandle(ref, () => localRef.current as T);
  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  });
  const isInView = !inView || inViewResult;
  return { ref: localRef, isInView };
}
