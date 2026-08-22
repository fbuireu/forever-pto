import type { HolidayDTO } from "@application/dto/holiday/types";
import type { FilterStrategy, MeasuredSuggestion } from "@domain/calendar/types";
import type { Locale } from "next-intl";
import type { FiltersState } from "./filters";

export interface GenerateSuggestionsParams {
	year: number;
	carryOverMonths: number;
	ptoDays: number;
	allowPastDays: boolean;
	strategy: FilterStrategy;
	locale: Locale;
}

export interface MainThreadSuggestionsParams extends GenerateSuggestionsParams {
	autoSuggestCount?: number;
}

export interface FetchHolidaysParams extends Pick<FiltersState, "year" | "country" | "region" | "carryOverMonths"> {
	locale: Locale;
}

export type PlanningWindowParams = Pick<FiltersState, "year" | "carryOverMonths">;

export interface AddHolidayParams {
	holiday: Omit<HolidayDTO, "id" | "variant" | "isInSelectedRange">;
	year: FiltersState["year"];
	carryOverMonths: FiltersState["carryOverMonths"];
}

export interface EditHolidayParams {
	holidayId: string;
	updates: Pick<HolidayDTO, "name" | "date">;
	year: FiltersState["year"];
	carryOverMonths: FiltersState["carryOverMonths"];
}

export interface AlternativeSelectionBaseParams {
	suggestion: MeasuredSuggestion | null;
	index: number;
}

export const DayRefusal = {
	NO_PLAN: "no_plan",
	DAY_IS_WEEKEND: "day_is_weekend",
	DAY_IS_HOLIDAY: "day_is_holiday",
	DAY_IS_CUSTOM_HOLIDAY: "day_is_custom_holiday",
	BUDGET_EXHAUSTED: "budget_exhausted",
} as const;

export type DayRefusal = (typeof DayRefusal)[keyof typeof DayRefusal];

export type DayOutcome = { applied: true } | { applied: false; reason: DayRefusal };

export const HolidayRefusal = {
	DATE_HELD_BY_HOLIDAY: "date_held_by_holiday",
	DATE_HELD_BY_MANUAL_DAY: "date_held_by_manual_day",
	HOLIDAY_NOT_FOUND: "holiday_not_found",
} as const;

export type HolidayRefusal = (typeof HolidayRefusal)[keyof typeof HolidayRefusal];

export type HolidayOutcome = { applied: true } | { applied: false; reason: HolidayRefusal; heldBy?: HolidayDTO };
