import { ACTIVATION_COOKIE } from "@application/dto/payment/types";
import ca from "@i18n/messages/ca.json";
import de from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import fr from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { LOCALE_COOKIE } from "@infrastructure/i18n/locales";
import { USER_COUNTRY_COOKIE } from "@infrastructure/proxy/cookie";
import { PREMIUM_COOKIE } from "@infrastructure/services/premium/cookie";
import { fireEvent, render, screen } from "@testing-library/react";
import { SIDEBAR_COOKIE_NAME } from "@ui/utils/sidebarCookie";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { CookieConsentDialog } from "./CookieConsentDialog";
import { COOKIE_SECTIONS } from "./config/config";

vi.mock("@infrastructure/proxy/cookie", async (importOriginal) => ({
	...(await importOriginal<typeof import("@infrastructure/proxy/cookie")>()),
	USER_COUNTRY_COOKIE: "visitor-country",
}));

vi.mock("@infrastructure/services/premium/cookie", async (importOriginal) => ({
	...(await importOriginal<typeof import("@infrastructure/services/premium/cookie")>()),
	PREMIUM_COOKIE: "visitor-premium-session",
}));

vi.mock("@application/dto/payment/types", async (importOriginal) => ({
	...(await importOriginal<typeof import("@application/dto/payment/types")>()),
	ACTIVATION_COOKIE: "visitor-activation-proof",
}));

vi.mock("@infrastructure/i18n/locales", async (importOriginal) => ({
	...(await importOriginal<typeof import("@infrastructure/i18n/locales")>()),
	LOCALE_COOKIE: "visitor-locale",
}));

vi.mock("@ui/utils/sidebarCookie", async (importOriginal) => ({
	...(await importOriginal<typeof import("@ui/utils/sidebarCookie")>()),
	SIDEBAR_COOKIE_NAME: "visitor-sidebar",
}));

const FIRST_PARTY_COOKIES = [
	USER_COUNTRY_COOKIE,
	PREMIUM_COOKIE,
	ACTIVATION_COOKIE,
	LOCALE_COOKIE,
	SIDEBAR_COOKIE_NAME,
];

interface RenderDialogParams {
	locale?: Locale;
	messages?: typeof en;
}

const renderDialog = ({ locale = "en", messages = en }: RenderDialogParams = {}) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<CookieConsentDialog
				open
				onOpenChange={vi.fn()}
				analyticsEnabled
				onAnalyticsChange={vi.fn()}
				serviceStates={{ ga4: true, betterStack: false }}
				onServiceChange={vi.fn()}
				onAcceptAll={vi.fn()}
				onRejectAll={vi.fn()}
				onSave={vi.fn()}
			/>
		</NextIntlClientProvider>,
	);

const SERVICES = COOKIE_SECTIONS.flatMap((section) => section.services ?? []);

const openEveryDetailsPanel = (messages = en) => {
	const triggers = screen.getAllByRole("button", { name: (name) => name.startsWith(messages.cookies.cookieDetails) });
	for (const trigger of triggers) fireEvent.click(trigger);
};

describe("CookieConsentDialog", () => {
	it("names every section switch after the section it turns off", () => {
		renderDialog();

		for (const section of COOKIE_SECTIONS) {
			expect(screen.getByRole("switch", { name: en.cookies[`${section.id}Cookies`] })).toBeTruthy();
		}
	});

	it("names every service switch after the service it turns off", () => {
		renderDialog();

		expect(SERVICES.length).toBeGreaterThan(0);
		for (const service of SERVICES) {
			expect(screen.getByRole("switch", { name: en.cookies[service.labelKey] })).toBeTruthy();
		}
	});

	it("leaves no switch nameless, whatever the config grows to", () => {
		renderDialog();

		const nameless = screen.getAllByRole("switch").filter((control) => {
			const ariaLabel = control.getAttribute("aria-label") ?? "";
			const id = control.getAttribute("id");
			return ariaLabel.length === 0 && !(id && document.querySelector(`label[for="${id}"]`));
		});

		expect(nameless).toEqual([]);
	});

	it("lists every first-party cookie under the name the code writes it by", async () => {
		renderDialog();
		openEveryDetailsPanel();
		await screen.findByText(USER_COUNTRY_COOKIE);

		expect(FIRST_PARTY_COOKIES.filter((name) => !name.startsWith("visitor-"))).toEqual([]);
		expect(FIRST_PARTY_COOKIES.filter((name) => screen.queryByText(name) === null)).toEqual([]);
	});
});

describe("CookieConsentDialog lifetimes", () => {
	const BUNDLES: Record<Locale, typeof en> = { en, es, ca, it: itMessages, de, fr };
	const COOKIES = COOKIE_SECTIONS.flatMap((section) => [
		...(section.cookies ?? []),
		...(section.services ?? []).flatMap((service) => service.cookies),
	]);

	const lifetimeOf = (name: string) => screen.getByText(name).nextElementSibling?.textContent ?? "";

	it("prints how long each cookie lives, the count included", async () => {
		renderDialog();
		openEveryDetailsPanel();
		await screen.findByText(USER_COUNTRY_COOKIE);

		expect(lifetimeOf(USER_COUNTRY_COOKIE)).toBe("1 week");
		expect(lifetimeOf("cc_cookie")).toBe("6 months");
		expect(lifetimeOf(PREMIUM_COOKIE)).toBe("30 days");
		expect(lifetimeOf(ACTIVATION_COOKIE)).toBe("1 hour");
		expect(lifetimeOf(LOCALE_COOKIE)).toBe(en.cookies.session);
		expect(lifetimeOf(SIDEBAR_COOKIE_NAME)).toBe("1 week");
		expect(lifetimeOf("__stripe_sid")).toBe("30 minutes");
		expect(lifetimeOf("_ga")).toBe("2 years");
		expect(lifetimeOf("_bs_sid")).toBe(en.cookies.session);
	});

	it.each(Object.entries(BUNDLES))("prints every %s lifetime whole, with its count", async (locale, messages) => {
		renderDialog({ locale: locale as Locale, messages });
		openEveryDetailsPanel(messages);
		await screen.findByText(USER_COUNTRY_COOKIE);

		expect(COOKIES.length).toBeGreaterThan(0);
		for (const cookie of COOKIES) {
			const lifetime = lifetimeOf(cookie.name);

			expect(lifetime).not.toMatch(/[{}]|cookies\./);
			if (cookie.expiryKey === "session") expect(lifetime).toBe(messages.cookies.session);
			else expect(lifetime.startsWith(`${cookie.expiryCount} `)).toBe(true);
		}
	});
});
