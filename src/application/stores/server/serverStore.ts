import { DEFAULT_QUERY_PARAMS } from "@const/const";
import type { SearchParams } from "@const/types";
import { create } from "zustand";

interface ServerState {
	// URL params only
	country: string;
	region: string;
	year: string;
	ptoDays: string;
	allowPastDays: string;
	carryOverMonths: string;

	// Actions
	setUrlParams: (params: SearchParams) => void;

	// Filter actions with history.pushState
	updateCountry: (country: string) => void;
	updateRegion: (region: string) => void;
	updateYear: (year: string) => void;
	updatePtoDays: (ptoDays: string) => void;
	updateAllowPastDays: (allowPastDays: string) => void;
	updateCarryOverMonths: (carryOverMonths: string) => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
	// Default URL params
	country: "",
	region: "",
	year: DEFAULT_QUERY_PARAMS.YEAR,
	ptoDays: DEFAULT_QUERY_PARAMS.PTO_DAYS,
	allowPastDays: DEFAULT_QUERY_PARAMS.ALLOW_PAST_DAYS,
	carryOverMonths: DEFAULT_QUERY_PARAMS.CARRY_OVER_MONTHS,

	// Actions
	setUrlParams: (params: SearchParams) => {
		const currentState = get();
		// Solo actualizar si los valores han cambiado
		const newState: Partial<ServerState> = {};
		let hasChanges = false;

		if (currentState.country !== (params.country || "")) {
			newState.country = params.country || "";
			hasChanges = true;
		}
		if (currentState.region !== (params.region || "")) {
			newState.region = params.region || "";
			hasChanges = true;
		}
		if (currentState.year !== (params.year || DEFAULT_QUERY_PARAMS.YEAR)) {
			newState.year = params.year || DEFAULT_QUERY_PARAMS.YEAR;
			hasChanges = true;
		}
		if (currentState.ptoDays !== (params.ptoDays || DEFAULT_QUERY_PARAMS.PTO_DAYS)) {
			newState.ptoDays = params.ptoDays || DEFAULT_QUERY_PARAMS.PTO_DAYS;
			hasChanges = true;
		}
		if (currentState.allowPastDays !== (params.allowPastDays || DEFAULT_QUERY_PARAMS.ALLOW_PAST_DAYS)) {
			newState.allowPastDays = params.allowPastDays || DEFAULT_QUERY_PARAMS.ALLOW_PAST_DAYS;
			hasChanges = true;
		}
		if (currentState.carryOverMonths !== (params.carryOverMonths || DEFAULT_QUERY_PARAMS.CARRY_OVER_MONTHS)) {
			newState.carryOverMonths = params.carryOverMonths || DEFAULT_QUERY_PARAMS.CARRY_OVER_MONTHS;
			hasChanges = true;
		}

		if (hasChanges) {
			set(newState);
		}
	},

	// Filter actions - optimized single property updates
	updateCountry: (country: string) => {
		if (get().country !== country) {
			set({ country });
		}
	},

	updateRegion: (region: string) => {
		if (get().region !== region) {
			set({ region });
		}
	},

	updateYear: (year: string) => {
		if (get().year !== year) {
			set({ year });
		}
	},

	updatePtoDays: (ptoDays: string) => {
		if (get().ptoDays !== ptoDays) {
			set({ ptoDays });
		}
	},

	updateAllowPastDays: (allowPastDays: string) => {
		if (get().allowPastDays !== allowPastDays) {
			set({ allowPastDays });
		}
	},

	updateCarryOverMonths: (carryOverMonths: string) => {
		if (get().carryOverMonths !== carryOverMonths) {
			set({ carryOverMonths });
		}
	},
}));

// Helper function to initialize server data
export async function initializeServerData(searchParams: SearchParams) {
	// Set URL params in store
	useServerStore.getState().setUrlParams(searchParams);

	// Return the search params for use in the page
	return searchParams;
}
