"use client";

import type { HolidayDTO } from "@application/dto/holiday/types";
import { useHolidaysStore } from "@application/stores/holidays/holidaysStore";
import { type ReactNode, useEffect } from "react";

interface HolidaysProviderProps {
	children: ReactNode;
	initialHolidays: HolidayDTO[];
}

export const HolidaysProvider = ({ children, initialHolidays }: HolidaysProviderProps) => {
	const setInitialHolidays = useHolidaysStore((state) => state.setInitialHolidays);

	useEffect(() => {
		setInitialHolidays(initialHolidays);
	}, [initialHolidays, setInitialHolidays]);

	return <>{children}</>;
};
