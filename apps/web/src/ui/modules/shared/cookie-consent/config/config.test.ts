import { ACTIVATION_COOKIE } from "@application/dto/payment/types";
import { LOCALE_COOKIE_POLICY } from "@infrastructure/i18n/cookie";
import { LOCALE_COOKIE } from "@infrastructure/i18n/locales";
import { ONE_WEEK, USER_COUNTRY_COOKIE } from "@infrastructure/proxy/cookie";
import {
	ACTIVATION_PROOF_LIFETIME_SECONDS,
	PREMIUM_COOKIE,
	PREMIUM_SESSION_LIFETIME_SECONDS,
} from "@infrastructure/services/premium/cookie";
import { SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME } from "@ui/utils/sidebarCookie";
import { describe, expect, it } from "vitest";
import { COOKIE_SECTIONS, type CookieEntry } from "./config";

const SECONDS_IN: Record<string, number> = { minutes: 60, hours: 3600, days: 86400, weeks: 604800 };

const lifetimeInSeconds = (entry: CookieEntry | undefined) =>
	entry === undefined || entry.expiryKey === "session"
		? undefined
		: entry.expiryCount * (SECONDS_IN[entry.expiryKey] ?? Number.NaN);

const entryOf = (name: string) =>
	COOKIE_SECTIONS.flatMap(({ cookies = [] }) => cookies).find((cookie) => cookie.name === name);

describe("the consent catalogue's first-party cookies", () => {
	it("lists each one for as long as the code keeps it", () => {
		expect({
			[USER_COUNTRY_COOKIE]: lifetimeInSeconds(entryOf(USER_COUNTRY_COOKIE)),
			[PREMIUM_COOKIE]: lifetimeInSeconds(entryOf(PREMIUM_COOKIE)),
			[ACTIVATION_COOKIE]: lifetimeInSeconds(entryOf(ACTIVATION_COOKIE)),
			[SIDEBAR_COOKIE_NAME]: lifetimeInSeconds(entryOf(SIDEBAR_COOKIE_NAME)),
		}).toEqual({
			[USER_COUNTRY_COOKIE]: ONE_WEEK,
			[PREMIUM_COOKIE]: PREMIUM_SESSION_LIFETIME_SECONDS,
			[ACTIVATION_COOKIE]: ACTIVATION_PROOF_LIFETIME_SECONDS,
			[SIDEBAR_COOKIE_NAME]: SIDEBAR_COOKIE_MAX_AGE,
		});
	});

	it("lists the locale cookie as a session cookie, because its policy sets no lifetime", () => {
		expect("maxAge" in LOCALE_COOKIE_POLICY).toBe(false);
		expect(entryOf(LOCALE_COOKIE)?.expiryKey).toBe("session");
	});

	it("marks every one of them as the app's own", () => {
		const own = [USER_COUNTRY_COOKIE, PREMIUM_COOKIE, ACTIVATION_COOKIE, LOCALE_COOKIE, SIDEBAR_COOKIE_NAME];

		expect(own.map((name) => entryOf(name)?.provider)).toEqual(own.map(() => "Forever PTO"));
	});
});
