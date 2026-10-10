import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { EN, ES, LOCALES } from "@infrastructure/i18n/locales";
import { render } from "@testing-library/react";
import { COOKIE_SECTIONS } from "@ui/modules/shared/cookie-consent/config/config";
import { createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const NAMESPACE = "cookiePolicy";
const ENV = { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_CONTACT_EMAIL: "test@test.com" };

const mockGetCloudflareContext = vi.fn();
const MockLegalLayout = vi.fn().mockReturnValue(null);
const mockGetTranslations = vi.fn();
const mockCreateRichLink = vi.fn().mockReturnValue(vi.fn().mockReturnValue(null));

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@ui/modules/layout/LegalLayout", () => ({
	LegalLayout: MockLegalLayout,
}));

vi.mock("@ui/modules/core/primitives/RichLink", () => ({
	createRichLink: mockCreateRichLink,
}));

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
}));

const { default: CookiePolicyPage } = await import("./page");

const makeParams = (locale = EN) => ({ params: Promise.resolve({ locale: locale as never }) });

const BUNDLES = { ca: caMessages, de: deMessages, en: enMessages, es: esMessages, fr: frMessages, it: itMessages };

describe("cookie-policy/page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const mockT = Object.assign(
			vi.fn((key: string) => `t:${key}`),
			{
				rich: vi.fn().mockReturnValue(null),
			},
		);
		mockGetTranslations.mockResolvedValue(mockT);
		mockGetCloudflareContext.mockResolvedValue({ env: ENV });
	});

	it("renders LegalLayout with translated title", async () => {
		const element = await CookiePolicyPage(makeParams());
		expect(element.type).toBe(MockLegalLayout);
		expect(element.props.title).toBe("t:title");
	});

	it("calls getTranslations with the cookiePolicy namespace", async () => {
		await CookiePolicyPage(makeParams());
		expect(mockGetTranslations).toHaveBeenCalledWith(expect.objectContaining({ namespace: NAMESPACE }));
	});

	it("passes locale to getTranslations", async () => {
		await CookiePolicyPage(makeParams(ES));
		expect(mockGetTranslations).toHaveBeenCalledWith(expect.objectContaining({ locale: ES }));
	});

	it("hands the layout this page's own date alone, which the layout labels once", async () => {
		const element = await CookiePolicyPage(makeParams());

		expect(element.props.lastUpdatedDate).toBe("October 10, 2026");
	});
});

describe("the cookie policy's Stripe paragraph", () => {
	const STRIPE = "Stripe";

	it.each(Object.entries(BUNDLES))(
		"names in %s every Stripe cookie the consent banner lists as necessary, since Stripe.js sets them on any page",
		(_locale, bundle) => {
			const necessaryStripeCookies = COOKIE_SECTIONS.filter(({ id }) => id === "necessary")
				.flatMap(({ cookies = [] }) => cookies)
				.filter(({ provider }) => provider === STRIPE)
				.map(({ name }) => name);
			const paragraph = bundle.cookiePolicy.sections.thirdPartyCookies.items.payment.description;

			expect(necessaryStripeCookies.length).toBeGreaterThan(1);
			expect(necessaryStripeCookies.filter((name) => !paragraph.includes(name))).toEqual([]);
		},
	);
});

describe("the cookie policy's own cookies", () => {
	const OWN_PROVIDER = "Forever PTO";
	const ownCookies = COOKIE_SECTIONS.flatMap(({ cookies = [] }) => cookies)
		.filter(({ provider }) => provider === OWN_PROVIDER)
		.map(({ name }) => name);

	it.each(LOCALES)(
		"renders in %s a line naming each of the app's own cookies the consent catalogue lists",
		async (locale) => {
			mockGetCloudflareContext.mockResolvedValue({ env: ENV });
			mockGetTranslations.mockResolvedValue(
				createTranslator({ locale, messages: BUNDLES[locale], namespace: NAMESPACE }),
			);

			const element = await CookiePolicyPage(makeParams(locale));
			const { container } = render(element.props.children);
			const text = container.textContent ?? "";

			expect(ownCookies.length).toBeGreaterThanOrEqual(6);
			expect(ownCookies.filter((name) => !text.includes(name))).toEqual([]);
		},
	);
});
