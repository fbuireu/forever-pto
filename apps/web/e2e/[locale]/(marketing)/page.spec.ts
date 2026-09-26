import enMessages from "@i18n/messages/en.json";
import { LOCALES } from "@infrastructure/i18n/locales";
import { localePath } from "@infrastructure/i18n/utils/url";
import { expect, test } from "@playwright/test";

const MAIN = "main#main-content";
const HOMEPAGE_NAMESPACE = "homepage.";
const DIALOG_OPEN_TIMEOUT = 3_000;
const PLANNER_NAVIGATION_TIMEOUT = 60_000;
const PHONE_VIEWPORT = { width: 390, height: 664 };

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

	test("the hero call to action opens the quick start and lands in the planner", async ({ page }) => {
		await page.goto("/");
		await page.context().addCookies([{ name: "user-country", value: "es", url: page.url() }]);
		await page.reload();

		const trigger = page.locator("#hero").getByRole("button", { name: enMessages.homepage.hero.plannerCta });
		const dialog = page.getByRole("dialog").filter({ has: page.getByRole("progressbar") });
		await expect(async () => {
			if (!(await dialog.isVisible())) await trigger.click();
			await expect(dialog).toBeVisible({ timeout: DIALOG_OPEN_TIMEOUT });
		}).toPass();
		await expect(dialog.getByRole("heading", { name: enMessages.quickStart.location.title })).toBeVisible();

		await dialog.getByRole("button", { name: enMessages.quickStart.next }).click();
		await expect(dialog.getByRole("heading", { name: enMessages.quickStart.ptoDays.title })).toBeVisible();
		await dialog.getByRole("button", { name: enMessages.quickStart.next }).click();
		await expect(dialog.getByRole("heading", { name: enMessages.quickStart.settings.title })).toBeVisible();
		await dialog.getByRole("button", { name: enMessages.quickStart.finish }).click();

		await expect(page).toHaveURL(/\/planner$/, { timeout: PLANNER_NAVIGATION_TIMEOUT });
	});

	test.describe("on a phone", () => {
		test.use({ viewport: PHONE_VIEWPORT });

		test("the quick start stays inside the screen and finishes from its longest step", async ({ page }) => {
			await page.goto("/");
			await page.context().addCookies([{ name: "user-country", value: "es", url: page.url() }]);
			await page.reload();

			const trigger = page.locator("#hero").getByRole("button", { name: enMessages.homepage.hero.plannerCta });
			const dialog = page.getByRole("dialog").filter({ has: page.getByRole("progressbar") });
			await expect(async () => {
				if (!(await dialog.isVisible())) await trigger.click();
				await expect(dialog).toBeVisible({ timeout: DIALOG_OPEN_TIMEOUT });
			}).toPass();

			await dialog.getByRole("button", { name: enMessages.quickStart.next }).click();
			await dialog.getByRole("button", { name: enMessages.quickStart.next }).click();
			await dialog.getByText(enMessages.sidebar.strategy.mainVacation.label, { exact: true }).click();
			await expect(dialog.getByText(enMessages.sidebar.preferredMonths.title, { exact: true })).toBeVisible();

			const box = await dialog.boundingBox();
			expect(box?.y).toBeGreaterThanOrEqual(0);
			expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(PHONE_VIEWPORT.height);

			await dialog.getByRole("button", { name: enMessages.quickStart.finish }).click();
			await expect(page).toHaveURL(/\/planner$/, { timeout: PLANNER_NAVIGATION_TIMEOUT });
		});
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
