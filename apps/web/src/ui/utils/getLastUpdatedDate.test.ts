import { EN, ES } from "@infrastructure/i18n/locales";
import { describe, expect, it } from "vitest";
import { getLastUpdatedDate } from "./getLastUpdatedDate";

describe("getLastUpdatedDate", () => {
	it("dates each legal page by its own last change, the legal notice apart from the three texts beside it", () => {
		expect({
			cookiePolicy: getLastUpdatedDate({ page: "cookiePolicy", locale: EN }),
			privacyPolicy: getLastUpdatedDate({ page: "privacyPolicy", locale: EN }),
			termsOfService: getLastUpdatedDate({ page: "termsOfService", locale: EN }),
			legalNotice: getLastUpdatedDate({ page: "legalNotice", locale: EN }),
		}).toEqual({
			cookiePolicy: "October 10, 2026",
			privacyPolicy: "October 10, 2026",
			termsOfService: "October 10, 2026",
			legalNotice: "March 31, 2026",
		});
	});

	it("prints the date in the reader's language", () => {
		expect(getLastUpdatedDate({ page: "legalNotice", locale: ES })).toBe("31 de marzo de 2026");
		expect(getLastUpdatedDate({ page: "cookiePolicy", locale: ES })).toBe("10 de octubre de 2026");
	});
});
