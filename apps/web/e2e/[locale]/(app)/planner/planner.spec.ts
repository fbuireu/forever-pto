import { ES } from "@infrastructure/i18n/locales";
import type { RoutePath } from "@infrastructure/seo/routes";
import { expect, test } from "../../../fixtures";

const PLANNER_PATH = "/planner" satisfies RoutePath;

test.describe("(app) planner", () => {
	test("returns 200", async ({ page }) => {
		const response = await page.goto(PLANNER_PATH);
		expect(response?.status()).toBe(200);
	});

	test("has a non-empty title", async ({ page }) => {
		await page.goto(PLANNER_PATH);
		await expect(page).toHaveTitle(/.+/);
	});

	test("locale-prefixed planner returns 200", async ({ page }) => {
		const response = await page.goto(`/${ES}${PLANNER_PATH}`);
		expect(response?.status()).toBe(200);
	});

	test("renders in the requested locale", async ({ page }) => {
		await page.goto(`/${ES}${PLANNER_PATH}`);
		await expect(page.locator("html")).toHaveAttribute("lang", ES);
	});

	test("renders a link back to the homepage", async ({ page }) => {
		await page.goto(PLANNER_PATH);
		await expect(page.locator('a[href="/"]').first()).toBeVisible();
	});
});
