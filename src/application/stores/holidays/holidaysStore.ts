import type { HolidayDTO } from "@application/dto/holiday/types";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface HolidaysState {
	removedHolidays: Set<string>;
	originalHolidays: HolidayDTO[];
	effectiveHolidays: HolidayDTO[];
	removeHoliday: (date: string) => void;
	restoreHoliday: (date: string) => void;
	reset: () => void;
	setInitialHolidays: (holidays: HolidayDTO[]) => void;
	updateHoliday: (date: string, updatedHoliday: HolidayDTO) => void;
	addHoliday: (holiday: HolidayDTO) => void;
}

// Función helper para calcular holidays efectivos
const calculateEffectiveHolidays = (original: HolidayDTO[], removed: Set<string>): HolidayDTO[] => {
	return original.filter((holiday) => !removed.has(holiday.date.toISOString()));
};

export const useHolidaysStore = create<HolidaysState>()(
	subscribeWithSelector((set, get) => ({
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
					effectiveHolidays: calculateEffectiveHolidays(state.originalHolidays, newRemovedHolidays),
				};
			}),

		restoreHoliday: (date) =>
			set((state) => {
				const newRemovedHolidays = new Set<string>([...state.removedHolidays]);
				newRemovedHolidays.delete(date);

				return {
					removedHolidays: newRemovedHolidays,
					effectiveHolidays: calculateEffectiveHolidays(state.originalHolidays, newRemovedHolidays),
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
					effectiveHolidays: calculateEffectiveHolidays(updatedOriginalHolidays, state.removedHolidays),
				};
			}),

		addHoliday: (holiday) =>
			set((state) => ({
				effectiveHolidays: [...state.effectiveHolidays, holiday],
			})),
	})),
);

// Selectores optimizados para evitar re-renders
export const useEffectiveHolidays = () => useHolidaysStore((state) => state.effectiveHolidays);
export const useOriginalHolidays = () => useHolidaysStore((state) => state.originalHolidays);
export const useRemovedHolidays = () => useHolidaysStore((state) => state.removedHolidays);
