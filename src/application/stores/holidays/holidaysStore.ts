import type { HolidayDTO } from "@application/dto/holiday/types";
import { create } from "zustand";

interface HolidaysState {
	removedHolidays: Set<string>;
	originalHolidays: HolidayDTO[];
	effectiveHolidays: HolidayDTO[];
	removeHoliday: (date: string) => void;
	restoreHoliday: (date: string) => void;
	reset: () => void;
	setInitialHolidays: (holidays: HolidayDTO[]) => void;
	updateHoliday: (date: string, updatedHoliday: HolidayDTO) => void;
}

export const useHolidaysStore = create<HolidaysState>((set) => ({
	removedHolidays: new Set<string>(),
	originalHolidays: [],
	effectiveHolidays: [],

	setInitialHolidays: (holidays) =>
		set({
			originalHolidays: holidays,
			effectiveHolidays: holidays,
			removedHolidays: new Set<string>(),
		}),

	removeHoliday: (date) =>
		set((state) => {
			const newRemovedHolidays = new Set<string>([...state.removedHolidays]);
			newRemovedHolidays.add(date);

			return {
				removedHolidays: newRemovedHolidays,
				effectiveHolidays: state.originalHolidays.filter(
					(holiday) => !newRemovedHolidays.has(holiday.date.toISOString()),
				),
			};
		}),

	restoreHoliday: (date) =>
		set((state) => {
			const newRemovedHolidays = new Set<string>([...state.removedHolidays]);
			newRemovedHolidays.delete(date);

			return {
				removedHolidays: newRemovedHolidays,
				effectiveHolidays: state.originalHolidays.filter(
					(holiday) => !newRemovedHolidays.has(holiday.date.toISOString()),
				),
			};
		}),

	reset: () =>
		set((state) => ({
			removedHolidays: new Set<string>(),
			effectiveHolidays: state.originalHolidays,
		})),

	updateHoliday: (date, updatedHoliday) =>
		set((state) => {
			const updatedOriginalHolidays = state.originalHolidays.map((holiday) =>
				holiday.date.toISOString() === date ? updatedHoliday : holiday,
			);

			return {
				originalHolidays: updatedOriginalHolidays,
				effectiveHolidays: updatedOriginalHolidays.filter(
					(holiday) => !state.removedHolidays.has(holiday.date.toISOString()),
				),
			};
		}),
}));
