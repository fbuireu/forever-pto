"use client";

import type { HolidayDTO } from "@application/dto/holiday/types";
import { type ReactNode, createContext, useContext, useReducer } from "react";

interface HolidaysState {
	removedHolidays: Set<string>;
	originalHolidays: HolidayDTO[];
	effectiveHolidays: HolidayDTO[];
}

type HolidaysAction =
	| { type: "REMOVE_HOLIDAY"; payload: string }
	| { type: "RESTORE_HOLIDAY"; payload: string }
	| { type: "RESET" };

const holidaysReducer = (state: HolidaysState, action: HolidaysAction): HolidaysState => {
	switch (action.type) {
		case "REMOVE_HOLIDAY": {
			const newRemovedHolidays = new Set<string>([...state.removedHolidays]);
			newRemovedHolidays.add(action.payload);

			return {
				...state,
				removedHolidays: newRemovedHolidays,
				effectiveHolidays: state.originalHolidays.filter(
					(holiday) => !newRemovedHolidays.has(holiday.date.toISOString()),
				),
			};
		}
		case "RESTORE_HOLIDAY": {
			const newRemovedHolidays = new Set<string>([...state.removedHolidays]);
			newRemovedHolidays.delete(action.payload);

			return {
				...state,
				removedHolidays: newRemovedHolidays,
				effectiveHolidays: state.originalHolidays.filter(
					(holiday) => !newRemovedHolidays.has(holiday.date.toISOString()),
				),
			};
		}
		case "RESET":
			return {
				...state,
				removedHolidays: new Set<string>(),
				effectiveHolidays: state.originalHolidays,
			};
		default:
			return state;
	}
};

const HolidaysContext = createContext<{
	state: HolidaysState;
	dispatch: React.Dispatch<HolidaysAction>;
} | null>(null);

export const useHolidays = () => {
	const context = useContext(HolidaysContext);

	if (!context) {
		throw new Error("useHolidays must be used within a HolidaysProvider");
	}

	return context;
};

export const HolidaysProvider = ({
	children,
	initialHolidays,
}: { children: ReactNode; initialHolidays: HolidayDTO[] }) => {
	const [state, dispatch] = useReducer(holidaysReducer, {
		removedHolidays: new Set<string>(),
		originalHolidays: initialHolidays,
		effectiveHolidays: initialHolidays,
	});

	return <HolidaysContext.Provider value={{ state, dispatch }}>{children}</HolidaysContext.Provider>;
};
