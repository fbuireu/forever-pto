import { LOCALES } from "@infrastructure/i18n/locales";
import { localePath } from "@infrastructure/i18n/utils/url";
import { expect, test } from "@playwright/test";

const NONEXISTENT = "/this-route-does-not-exist-xyz";
const MAIN = "main#main-content";
const NOT_FOUND_NAMESPACE = "notFound.";

test.describe("[locale] not-found", () => {
	test("returns 404 for an unknown path", { tag: "@smoke" }, async ({ page }) => {
		const response = await page.goto(NONEXISTENT);
		expect(response?.status()).toBe(404);
	});

	test("renders the 404 heading", async ({ page }) => {
		await page.goto(NONEXISTENT);
		await expect(page.getByRole("heading", { level: 1 })).toContainText("vacation");
	});

	test("shows a link back to home", async ({ page }) => {
		await page.goto(NONEXISTENT);
		await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
	});

	test("shows the 404 page's own planner call to action", async ({ page }) => {
		await page.goto(NONEXISTENT);
		await expect(page.locator(MAIN).getByRole("link", { name: /open the planner/i })).toBeVisible();
	});

	for (const locale of LOCALES) {
		test(`answers 404 in ${locale} with a rendered heading`, async ({ page }) => {
			const response = await page.goto(localePath({ locale, path: NONEXISTENT }));
			expect(response?.status()).toBe(404);

			await expect(page.locator("html")).toHaveAttribute("lang", locale);

			const heading = page.locator(MAIN).getByRole("heading", { level: 1 });
			await expect(heading).toBeVisible();
			await expect(heading).toHaveText(/\S/);
			await expect(heading).not.toContainText(NOT_FOUND_NAMESPACE);
		});
	}
});
