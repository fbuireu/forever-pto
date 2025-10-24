import { useCallback, useEffect, useRef, useState } from 'react';

interface CommonControlledStateProps<T> {
  value?: T;
  defaultValue?: T;
}

export function useControlledState<T, Rest extends unknown[] = []>(
  props: CommonControlledStateProps<T> & {
    onChange?: (value: T, ...args: Rest) => void;
  }
): readonly [T, (next: T, ...args: Rest) => void] {
  const { value, defaultValue, onChange } = props;

  const [state, setInternalState] = useState<T>(value ?? (defaultValue as T));
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (value !== undefined) setInternalState(value);
  }, [value]);

  const setState = useCallback((next: T, ...args: Rest) => {
    setInternalState(next);
    onChangeRef.current?.(next, ...args);
  }, []);

  return [state, setState] as const;
}
