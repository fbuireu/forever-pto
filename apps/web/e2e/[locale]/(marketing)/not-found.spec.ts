import { LOCALES } from "@infrastructure/i18n/locales";
import { localePath } from "@infrastructure/i18n/utils/url";
import { expect, test } from "../../fixtures";
import { expectLocalizedNotFound } from "../../notFound";

const NONEXISTENT = "/this-route-does-not-exist-xyz";
const NESTED_NONEXISTENT = "/this-route/does-not/exist-xyz";
const MAIN = "main#main-content";

test.describe("(marketing) not-found", () => {
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
		test(`answers an unknown path in ${locale} with its own 404, inside the shell`, async ({ page }) => {
			await expectLocalizedNotFound({ page, path: localePath({ locale, path: NONEXISTENT }), locale });
			await expectLocalizedNotFound({ page, path: localePath({ locale, path: NESTED_NONEXISTENT }), locale });
		});
	}
});
