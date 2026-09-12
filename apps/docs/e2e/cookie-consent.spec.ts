import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const BANNER = "#cc-main .cm";
const CONSENT_COOKIE = "cc_cookie";
const GA_COOKIE = /^_ga/;

const cookieNames = async (page: Page) => (await page.context().cookies()).map((cookie) => cookie.name);

const betterStackScripts = (page: Page) => page.locator('script[src*="betterstack.net/b.js"]');

test.describe("cookie consent gates every analytics service", () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "webdriver", { get: () => false });
		});
	});

	test("shows the banner on a first visit", async ({ page }) => {
		await page.goto("/");

		await expect(page.locator(BANNER)).toBeVisible();
	});

	test("sets no analytics cookie and loads no tracker before an answer", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(BANNER)).toBeVisible();

		expect((await cookieNames(page)).filter((name) => GA_COOKIE.test(name))).toEqual([]);
		await expect(betterStackScripts(page)).toHaveCount(0);
	});

	test("keeps Google Analytics storage denied until the visitor accepts", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(BANNER)).toBeVisible();

		const consentCalls = await page.evaluate(() =>
			(window.dataLayer ?? [])
				.map((entry) => Array.from(entry as ArrayLike<unknown>))
				.filter((entry) => entry[0] === "consent"),
		);

		expect(consentCalls).not.toEqual([]);
		expect(JSON.stringify(consentCalls)).toContain('"analytics_storage":"denied"');
	});

	test("rejecting stores the choice and still sets no analytics cookie", async ({ page }) => {
		await page.goto("/");
		await page
			.locator(BANNER)
			.getByRole("button", { name: /reject all/i })
			.click();

		await expect(page.locator(BANNER)).toBeHidden();
		expect(await cookieNames(page)).toContain(CONSENT_COOKIE);
		expect((await cookieNames(page)).filter((name) => GA_COOKIE.test(name))).toEqual([]);
		await expect(betterStackScripts(page)).toHaveCount(0);
	});

	test("accepting grants analytics storage through Consent Mode", async ({ page }) => {
		await page.goto("/");
		await page
			.locator(BANNER)
			.getByRole("button", { name: /accept all/i })
			.click();

		await expect(page.locator(BANNER)).toBeHidden();
		expect(await cookieNames(page)).toContain(CONSENT_COOKIE);

		await expect
			.poll(async () =>
				page.evaluate(() =>
					JSON.stringify(
						(window.dataLayer ?? [])
							.map((entry) => Array.from(entry as ArrayLike<unknown>))
							.filter((entry) => entry[0] === "consent" && entry[1] === "update"),
					),
				),
			)
			.toContain('"analytics_storage":"granted"');
	});

	test("the banner offers a per-service choice rather than one switch", async ({ page }) => {
		await page.goto("/");
		await page
			.locator(BANNER)
			.getByRole("button", { name: /choose/i })
			.click();

		const preferences = page.locator("#cc-main .pm");
		await expect(preferences).toBeVisible();
		await preferences.getByRole("button", { name: "Analytics" }).click();

		await expect(preferences.locator('input.section__toggle[value="ga4"]')).toBeAttached();
		await expect(preferences.locator('input.section__toggle[value="betterStack"]')).toBeAttached();
		await expect(preferences.locator('input.section__toggle[value="necessary"]')).toBeDisabled();
	});
});
