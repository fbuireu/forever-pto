import { LOCALES } from "@infrastructure/i18n/locales";
import { localePath } from "@infrastructure/i18n/utils/url";
import { expect, test } from "@playwright/test";

const MAIN = "main#main-content";
const HOMEPAGE_NAMESPACE = "homepage.";

test.describe("(marketing) homepage", () => {
	test("returns 200", async ({ page }) => {
		const response = await page.goto("/");
		expect(response?.status()).toBe(200);
	});

	test("has a non-empty title", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/.+/);
	});

	test("renders main#main-content", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(MAIN)).toBeVisible();
	});

	test("renders the hero section", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#hero")).toBeVisible();
	});

	test("renders the features section", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#features")).toBeVisible();
	});

	test("renders the pricing section", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#pricing")).toBeVisible();
	});

	test("renders the faq section", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#faq")).toBeVisible();
	});

	test("has a link to the planner", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator('a[href="/planner"]').first()).toBeVisible();
	});

	for (const locale of LOCALES) {
		test(`answers 200 in ${locale} with a rendered heading`, async ({ page }) => {
			const response = await page.goto(localePath({ locale }));
			expect(response?.status()).toBe(200);

			await expect(page.locator("html")).toHaveAttribute("lang", locale);

			const heading = page.locator(MAIN).getByRole("heading", { level: 1 });
			await expect(heading).toBeVisible();
			await expect(heading).toHaveText(/\S/);
			await expect(heading).not.toContainText(HOMEPAGE_NAMESPACE);
		});
	}
});
