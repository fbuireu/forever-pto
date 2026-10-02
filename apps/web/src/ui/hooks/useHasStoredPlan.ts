"use client";

import { hasStoredPlan } from "@application/stores/storedPlan";
import { useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
	globalThis.addEventListener("storage", callback);
	return () => globalThis.removeEventListener("storage", callback);
};

const getServerSnapshot = () => false;

export const useHasStoredPlan = () => useSyncExternalStore(subscribe, hasStoredPlan, getServerSnapshot);
