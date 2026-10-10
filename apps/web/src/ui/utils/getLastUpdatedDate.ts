import { formatDate } from "@application/shared/utils/dates";
import type { Locale } from "next-intl";

type LegalPage = "cookiePolicy" | "privacyPolicy" | "termsOfService" | "legalNotice";

const LAST_UPDATED: Record<LegalPage, Date> = {
	cookiePolicy: new Date(2026, 9, 10),
	privacyPolicy: new Date(2026, 9, 10),
	termsOfService: new Date(2026, 9, 10),
	legalNotice: new Date(2026, 2, 31),
};

interface GetLastUpdatedDateParams {
	page: LegalPage;
	locale: Locale;
}

export function getLastUpdatedDate({ page, locale }: GetLastUpdatedDateParams) {
	return formatDate({ date: LAST_UPDATED[page], locale, format: "MMMM d, yyyy" });
}
