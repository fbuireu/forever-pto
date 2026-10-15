"use client";

import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

const subscribe = (callback: () => void): (() => void) => {
	const mediaQueryList = globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
	mediaQueryList.addEventListener("change", callback);
	return () => mediaQueryList.removeEventListener("change", callback);
};

const getSnapshot = (): boolean => {
	return globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
};

const getServerSnapshot = (): boolean => {
	return false;
};

export function useIsMobile(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
