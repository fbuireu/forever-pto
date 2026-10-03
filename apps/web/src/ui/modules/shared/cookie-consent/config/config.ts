import type messages from "@i18n/messages/en.json";
import { USER_COUNTRY_COOKIE } from "@infrastructure/proxy/cookie";

type CookiesKey = keyof (typeof messages)["cookies"];

type CookieDuration = Extract<CookiesKey, "minutes" | "hours" | "weeks" | "months" | "years">;

type CookieExpiry = { expiryKey: Extract<CookiesKey, "session"> } | { expiryKey: CookieDuration; expiryCount: number };

export type CookieEntry = CookieExpiry & {
	name: string;
	descriptionKey: CookiesKey;
	provider: string;
	learnMoreUrl?: string;
};

export interface CookieService {
	id: string;
	labelKey: CookiesKey;
	cookies: CookieEntry[];
}

export interface CookieSection {
	id: "necessary" | "analytics";
	cookies?: CookieEntry[];
	services?: CookieService[];
}

export const COOKIE_SECTIONS: CookieSection[] = [
	{
		id: "necessary",
		cookies: [
			{
				name: USER_COUNTRY_COOKIE,
				expiryKey: "weeks",
				expiryCount: 1,
				descriptionKey: "userCountryDesc",
				provider: "Forever PTO",
			},
			{
				name: "cc_cookie",
				expiryKey: "months",
				expiryCount: 6,
				descriptionKey: "ccCookieDesc",
				provider: "Forever PTO",
			},
			{
				name: "__stripe_mid",
				expiryKey: "years",
				expiryCount: 1,
				descriptionKey: "stripeMidDesc",
				provider: "Stripe",
			},
			{
				name: "__stripe_sid",
				expiryKey: "minutes",
				expiryCount: 30,
				descriptionKey: "stripeSidDesc",
				provider: "Stripe",
			},
		],
	},
	{
		id: "analytics",
		services: [
			{
				id: "ga4",
				labelKey: "ga4Label",
				cookies: [
					{
						name: "_ga",
						expiryKey: "years",
						expiryCount: 2,
						descriptionKey: "gaDesc",
						provider: "Google Analytics",
						learnMoreUrl: "https://policies.google.com/technologies/cookies",
					},
					{
						name: "_ga_*",
						expiryKey: "years",
						expiryCount: 2,
						descriptionKey: "gaStarDesc",
						provider: "Google Analytics",
					},
					{
						name: "_gid",
						expiryKey: "hours",
						expiryCount: 24,
						descriptionKey: "gidDesc",
						provider: "Google Analytics",
					},
				],
			},
			{
				id: "betterStack",
				labelKey: "betterStackLabel",
				cookies: [
					{
						name: "_bs_uid",
						expiryKey: "years",
						expiryCount: 1,
						descriptionKey: "bsUidDesc",
						provider: "Better Stack",
					},
					{
						name: "_bs_sid",
						expiryKey: "session",
						descriptionKey: "bsSidDesc",
						provider: "Better Stack",
					},
				],
			},
		],
	},
];
