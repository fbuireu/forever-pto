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

// Helper function to update URL with history.pushState
const updateUrl = (key: string, value: string) => {
	if (typeof window === "undefined") return;

	const url = new URL(window.location.href);
	const searchParams = url.searchParams;

	if (value && value !== "") {
		searchParams.set(key, value);
	} else {
		searchParams.delete(key);
	}

	window.history.pushState({}, "", url.toString());
};

export const useServerStore = create<ServerState>((set) => ({
	// Default URL params
	country: "",
	region: "",
	year: DEFAULT_QUERY_PARAMS.YEAR,
	ptoDays: DEFAULT_QUERY_PARAMS.PTO_DAYS,
	allowPastDays: DEFAULT_QUERY_PARAMS.ALLOW_PAST_DAYS,
	carryOverMonths: DEFAULT_QUERY_PARAMS.CARRY_OVER_MONTHS,

	// Actions
	setUrlParams: (params: SearchParams) =>
		set({
			country: params.country || "",
			region: params.region || "",
			year: params.year || DEFAULT_QUERY_PARAMS.YEAR,
			ptoDays: params.ptoDays || DEFAULT_QUERY_PARAMS.PTO_DAYS,
			allowPastDays: params.allowPastDays || DEFAULT_QUERY_PARAMS.ALLOW_PAST_DAYS,
			carryOverMonths: params.carryOverMonths || DEFAULT_QUERY_PARAMS.CARRY_OVER_MONTHS,
		}),

	// Filter actions - only update URL and store, no data reload
	updateCountry: (country: string) => {
		set({ country });
		updateUrl("country", country);
	},

	updateRegion: (region: string) => {
		set({ region });
		updateUrl("region", region);
	},

	updateYear: (year: string) => {
		set({ year });
		updateUrl("year", year);
	},

	updatePtoDays: (ptoDays: string) => {
		set({ ptoDays });
		updateUrl("ptoDays", ptoDays);
	},

	updateAllowPastDays: (allowPastDays: string) => {
		set({ allowPastDays });
		updateUrl("allowPastDays", allowPastDays);
	},

	updateCarryOverMonths: (carryOverMonths: string) => {
		set({ carryOverMonths });
		updateUrl("carryOverMonths", carryOverMonths);
	},
}));

// Helper function to initialize server data
export async function initializeServerData(searchParams: SearchParams) {
	// Set URL params in store
	useServerStore.getState().setUrlParams(searchParams);

	// Return the search params for use in the page
	return searchParams;
}
