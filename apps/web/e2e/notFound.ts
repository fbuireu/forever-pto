import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import type { LocaleCode } from "@infrastructure/i18n/locales";
import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

export const NOT_FOUND_BUNDLES = {
	ca: caMessages,
	de: deMessages,
	en: enMessages,
	es: esMessages,
	fr: frMessages,
	it: itMessages,
} satisfies Record<LocaleCode, typeof enMessages>;

const MAIN = "main#main-content";
const NOINDEX = /<meta name="robots" content="[^"]*noindex/;
const RICH_TAG = /<\/?\w+>/g;

export interface ExpectLocalizedNotFoundParams {
	page: Page;
	path: string;
	locale: LocaleCode;
}

export const expectLocalizedNotFound = async ({ page, path, locale }: ExpectLocalizedNotFoundParams) => {
	const messages = NOT_FOUND_BUNDLES[locale];
	const response = await page.goto(path);
	const html = (await response?.text()) ?? "";

	expect(response?.status()).toBe(404);
	expect(html).toMatch(NOINDEX);

	await expect(page.locator(MAIN).getByRole("heading", { level: 1 })).toHaveText(
		messages.notFound.title.replace(RICH_TAG, ""),
	);
	await expect(page.locator("html")).toHaveAttribute("lang", locale);
	await expect(page).toHaveTitle(messages.metadata.notFound.title);
	await expect(page.getByRole("button", { name: messages.homepage.nav.trialAction })).toBeVisible();
	await expect(page.locator("footer").getByRole("link", { name: messages.footer.privacyPolicy })).toBeVisible();

	return html;
};
