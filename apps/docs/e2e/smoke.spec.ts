import { expect, test } from "@playwright/test";

test.describe("production smoke", () => {
	test("the homepage answers with a rendered document @smoke", async ({ page }) => {
		const response = await page.goto("/");

		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(/.+/);
		await expect(page.locator("main")).toBeVisible();
	});
});
