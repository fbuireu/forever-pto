"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseControlledStateParams<T, Rest extends unknown[] = []> {
	value?: T;
	defaultValue?: T;
	onChange?: (value: T, ...args: Rest) => void;
}

export function useControlledState<T, Rest extends unknown[] = []>(props: UseControlledStateParams<T, Rest>) {
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
