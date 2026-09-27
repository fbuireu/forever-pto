export const HOLIDAYS_STORAGE_NAME = "holidays-store";

export const hasStoredPlan = (): boolean => {
	if (typeof localStorage === "undefined") return false;

	try {
		return localStorage.getItem(HOLIDAYS_STORAGE_NAME) !== null;
	} catch {
		return false;
	}
};
