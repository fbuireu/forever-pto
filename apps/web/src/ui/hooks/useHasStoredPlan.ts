"use client";

import { hasStoredPlan } from "@application/stores/storedPlan";
import { useSyncExternalStore } from "react";

const subscribe = (callback: () => void): (() => void) => {
	globalThis.addEventListener("storage", callback);
	return () => globalThis.removeEventListener("storage", callback);
};

const getServerSnapshot = (): boolean => false;

export const useHasStoredPlan = (): boolean => useSyncExternalStore(subscribe, hasStoredPlan, getServerSnapshot);
