import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const holidaysState = vi.hoisted(() => ({
	current: {
		currentSelection: null as { days: Date[] } | null,
		suggestion: null as { days: Date[] } | null,
		manuallySelectedDays: [] as Date[],
		removedSuggestedDays: [] as Date[],
		isCalculating: false,
	},
}));

const filtersState = vi.hoisted(() => ({ current: { ptoDays: 10 } }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector(holidaysState.current),
}));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector(filtersState.current),
}));

const { usePlanReadout } = await import("./usePlanReadout");

const day = (n: number) => new Date(2026, 4, n);

beforeEach(() => {
	holidaysState.current = {
		currentSelection: null,
		suggestion: null,
		manuallySelectedDays: [],
		removedSuggestedDays: [],
		isCalculating: false,
	};
	filtersState.current = { ptoDays: 10 };
});

describe("usePlanReadout", () => {
	it("falls back to the base Suggestion when no Alternative is applied", () => {
		holidaysState.current.suggestion = { days: [day(1), day(2)] };
		const { result } = renderHook(() => usePlanReadout());

		expect(result.current.suggested).toBe(2);
		expect(result.current.remaining).toBe(8);
	});

	it("prefers the applied Alternative over the base Suggestion", () => {
		holidaysState.current.suggestion = { days: [day(1), day(2)] };
		holidaysState.current.currentSelection = { days: [day(5)] };
		const { result } = renderHook(() => usePlanReadout());

		expect(result.current.suggested).toBe(1);
	});

	it("freezes the remaining budget while a calculation is in flight", () => {
		holidaysState.current.suggestion = { days: [day(1), day(2)] };
		const { result, rerender } = renderHook(() => usePlanReadout());

		expect(result.current.remaining).toBe(8);

		holidaysState.current.isCalculating = true;
		holidaysState.current.suggestion = { days: [] };
		rerender();

		expect(result.current.remaining).toBe(8);
	});

	it("releases the frozen value once the calculation settles", () => {
		holidaysState.current.suggestion = { days: [day(1), day(2)] };
		const { result, rerender } = renderHook(() => usePlanReadout());

		holidaysState.current.isCalculating = true;
		rerender();

		holidaysState.current.isCalculating = false;
		holidaysState.current.suggestion = { days: [day(1), day(2), day(3)] };
		rerender();

		expect(result.current.remaining).toBe(7);
	});

	it("reports hand edits from either direction", () => {
		expect(renderHook(() => usePlanReadout()).result.current.hasManualChanges).toBe(false);

		holidaysState.current.manuallySelectedDays = [day(4)];
		expect(renderHook(() => usePlanReadout()).result.current.hasManualChanges).toBe(true);

		holidaysState.current.manuallySelectedDays = [];
		holidaysState.current.removedSuggestedDays = [day(4)];
		expect(renderHook(() => usePlanReadout()).result.current.hasManualChanges).toBe(true);
	});
});
