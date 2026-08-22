import { formatDate } from "@application/shared/utils/dates";
import type { Locale } from "next-intl";

const LAST_UPDATED = new Date(2026, 2, 31);

export function getLastUpdatedDate(locale: Locale) {
	return formatDate({ date: LAST_UPDATED, locale, format: "MMMM d, yyyy" });
}
