import type { CapitalizeKeys } from "@const/types";
import type { FilterMaximumValues } from "@modules/components/appSidebar/types";

export const FILTER_MAXIMUM_VALUES: CapitalizeKeys<FilterMaximumValues> = {
	CARRY_OVER_MONTHS: {
		FREE: 1,
		PREMIUM: 12,
	},
	YEARS: (year: string) => Array.from({ length: 11 }, (_, i) => Number(year) - 5 + i),
} as const;

export const DEFAULT_SIDEBAR_CONFIG: Record<CapitalizeKeys<string>, string | number> = {
	SIDEBAR_COOKIE_NAME: "sidebar_state",
	SIDEBAR_COOKIE_MAX_AGE: 60 * 60 * 24 * 7,
	SIDEBAR_WIDTH: "20rem",
	SIDEBAR_WIDTH_MOBILE: "18rem",
	SIDEBAR_WIDTH_ICON: "3rem",
	SIDEBAR_KEYBOARD_SHORTCUT: "b",
} as const;
