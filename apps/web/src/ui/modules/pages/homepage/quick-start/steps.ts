import type { FiltersState } from "@application/stores/filters";

export const QuickStartStep = {
	LOCATION: "location",
	PTO_DAYS: "ptoDays",
	SETTINGS: "settings",
} as const;

export type QuickStartStep = (typeof QuickStartStep)[keyof typeof QuickStartStep];

export const QUICK_START_STEPS: readonly QuickStartStep[] = [
	QuickStartStep.LOCATION,
	QuickStartStep.PTO_DAYS,
	QuickStartStep.SETTINGS,
];

export type QuickStartDraft = FiltersState;

interface CreateDraftParams {
	filters: FiltersState;
	detectedCountry?: string;
}

export function createDraft({ filters, detectedCountry }: CreateDraftParams): QuickStartDraft {
	const country = filters.country || detectedCountry || "";

	return {
		ptoDays: filters.ptoDays,
		allowPastDays: filters.allowPastDays,
		country,
		region: country === filters.country ? filters.region : "",
		year: filters.year,
		carryOverMonths: filters.carryOverMonths,
		strategy: filters.strategy,
	};
}

interface CanLeaveStepParams {
	step: QuickStartStep;
	draft: Pick<QuickStartDraft, "country">;
}

export function canLeaveStep({ step, draft }: CanLeaveStepParams): boolean {
	return step !== QuickStartStep.LOCATION || draft.country !== "";
}

const YEARS_BEFORE = 1;
const YEARS_AFTER = 2;

interface YearOptionsParams {
	currentYear: number;
	selectedYear: number;
}

export function yearOptions({ currentYear, selectedYear }: YearOptionsParams): number[] {
	const years = Array.from(
		{ length: YEARS_BEFORE + 1 + YEARS_AFTER },
		(_, index) => currentYear - YEARS_BEFORE + index,
	);

	return years.includes(selectedYear) ? years : [selectedYear, ...years].sort((a, b) => a - b);
}

export function trackedDraft(draft: QuickStartDraft) {
	return {
		country: draft.country,
		region: draft.region,
		year: draft.year,
		strategy: draft.strategy,
		allowPastDays: draft.allowPastDays,
		carryOverMonths: draft.carryOverMonths,
	};
}
