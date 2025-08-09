import { useEffect, useRef, useState } from 'react';

interface UseDebounceParams<T> {
  value: T;
  delay: number;
  callback: (value: T) => void;
}

export const useDebounce = <T>({ value, delay, callback }: UseDebounceParams<T>) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const setValue = (newValue: T) => {
    setLocalValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(newValue);
    }, delay);
  };

  return [localValue, setValue] as const;
};
