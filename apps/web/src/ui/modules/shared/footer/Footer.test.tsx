import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import { createTranslator, type Locale, NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { version } from "../../../../../package.json";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@ui/utils/getCurrentYear", () => ({ getCurrentYear: vi.fn().mockResolvedValue(2026) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("../contact/ContactButton", () => ({
	ContactButton: () => (
		<button type="button" data-testid="contact">
			contact
		</button>
	),
}));
vi.mock("./components/CookieButton", () => ({
	CookieButton: () => (
		<button type="button" data-testid="cookies">
			cookies
		</button>
	),
}));
vi.mock("./components/DevFooter", () => ({ DevFooter: () => null }));

import { Footer } from "./Footer";

const footer = enMessages.footer;

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderFooterParams {
	locale?: Locale;
	messages?: typeof enMessages;
}

const footerTree = async ({ locale = "en", messages = enMessages }: RenderFooterParams = {}) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "footer" }));
	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			{await Footer()}
		</NextIntlClientProvider>
	);
};

const renderFooter = async (params: RenderFooterParams = {}) => render(await footerTree(params));

describe("Footer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers({ now: new Date(2026, 5, 15), toFake: ["Date"] });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("labels the legal navigation, since the page carries more than one nav landmark", async () => {
		await renderFooter();

		expect(screen.getByRole("navigation", { name: footer.legalNavigation })).toBeDefined();
	});

	it("links every legal page and the planner by their translated names", async () => {
		await renderFooter();
		const hrefOf = (name: string) => screen.getByRole("link", { name }).getAttribute("href");

		expect(hrefOf(footer.planner)).toBe("/planner");
		expect(hrefOf(footer.privacyPolicy)).toBe("/legal/privacy-policy");
		expect(hrefOf(footer.termsOfService)).toBe("/legal/terms-of-service");
		expect(hrefOf(footer.cookiePolicy)).toBe("/legal/cookie-policy");
		expect(hrefOf(footer.legalNotice)).toBe("/legal/legal-notice");
	});

	it("opens the docs site in a new tab without leaking the referrer", async () => {
		await renderFooter();
		const docs = screen.getByRole("link", { name: footer.docs });

		expect(docs.getAttribute("href")).toBe("https://docs.forever-pto.com");
		expect(docs.getAttribute("target")).toBe("_blank");
		expect(docs.getAttribute("rel")).toBe("noreferrer");
	});

	it("prints the shipped version with a single live dot, the pulsing one", async () => {
		const { container } = await renderFooter();
		const text = container.textContent ?? "";

		expect(text).toContain(`v${version}`);
		expect(text.split("●")).toHaveLength(2);
		expect(container.querySelector(".animate-pulse")?.textContent).toBe("●");
	});

	it.each(Object.entries(BUNDLES))("renders the %s version line with its live dot", async (locale, messages) => {
		const { container } = await renderFooter({ locale: locale as Locale, messages });
		const line = container.querySelector(".animate-pulse")?.parentElement;

		expect(container.querySelector(".animate-pulse")?.textContent).toBe("●");
		expect(line?.textContent).toContain(`v${version}`);
		expect(line?.textContent).not.toMatch(/[<>{}]|footer\./);
	});

	it("stamps the copyright with the year the server rendered with, so the prerendered HTML and the first pass agree", async () => {
		vi.useFakeTimers({ now: new Date(2031, 0, 1), toFake: ["Date"] });

		expect(renderToString(await footerTree())).toContain(footer.copyright.replace("{year}", "2026"));
	});

	it("moves the copyright to the visitor's year once mounted, after a deploy from an earlier year", async () => {
		vi.useFakeTimers({ now: new Date(2031, 0, 1), toFake: ["Date"] });

		const { container } = await renderFooter();

		expect(container.textContent).toContain(footer.copyright.replace("{year}", "2031"));
	});

	it.each(Object.entries(BUNDLES))("renders the %s copyright with the year in place", async (locale, messages) => {
		const { container } = await renderFooter({ locale: locale as Locale, messages });

		expect(container.textContent).toContain(messages.footer.copyright.replace("{year}", "2026"));
	});

	it("keeps the cookie and contact controls inside the legal navigation", async () => {
		await renderFooter();
		const landmark = screen.getByRole("navigation", { name: footer.legalNavigation });

		expect(landmark.contains(screen.getByTestId("cookies"))).toBe(true);
		expect(landmark.contains(screen.getByTestId("contact"))).toBe(true);
	});
});
