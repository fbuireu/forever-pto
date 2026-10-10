import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import type { QuickStartDraft } from "./steps";

export function startPlanning(draft: QuickStartDraft) {
	const filters = useFiltersStore.getState();
	filters.setCountry(draft.country);
	filters.setRegion(draft.region);
	filters.setYear(draft.year);
	filters.setPtoDays(draft.ptoDays);
	filters.setStrategy(draft.strategy);
	filters.setPreferredMonths(draft.preferredMonths);
	filters.setAllowPastDays(draft.allowPastDays);
	filters.setCarryOverMonths(draft.carryOverMonths);
	useHolidaysStore.getState().askForPlan();
}
