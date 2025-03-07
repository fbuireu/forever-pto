import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: T) => {
    const timeoutId = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay]);
}