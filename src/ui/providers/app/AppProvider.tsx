"use client";

import { useHolidaysStore } from "@application/stores/holidays/holidaysStore";
import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { usePremiumStatusVerification } from "@ui/hooks/usePremiumStatusVerification/usePremiumStatusVerification";
import { type ReactNode, useEffect } from "react";

interface AppProviderProps {
	children: ReactNode;
	initialHolidays: any[];
	initialIsPremium: boolean;
}

export function AppProvider({ children, initialHolidays, initialIsPremium }: AppProviderProps) {
	const { setInitialHolidays } = useHolidaysStore();
	const { setPremiumStatus } = usePremiumStore();

	// Initialize all stores from server data
	useEffect(() => {
		setInitialHolidays(initialHolidays);
		setPremiumStatus(initialIsPremium);
	}, [initialHolidays, initialIsPremium, setInitialHolidays, setPremiumStatus]);

	// Premium status verification
	usePremiumStatusVerification();

	return <>{children}</>;
}
