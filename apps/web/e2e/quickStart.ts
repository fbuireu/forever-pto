import enMessages from "@i18n/messages/en.json";
import { USER_COUNTRY_COOKIE } from "@infrastructure/proxy/cookie";
import type { Locator, Page } from "@playwright/test";
import { expect } from "./fixtures";

const DIALOG_OPEN_TIMEOUT = 3_000;
const PLANNER_NAVIGATION_TIMEOUT = 60_000;

export const openQuickStart = async (page: Page): Promise<Locator> => {
	await page.goto("/");
	await page.context().addCookies([{ name: USER_COUNTRY_COOKIE, value: "es", url: page.url() }]);
	await page.reload();

	const trigger = page.locator("#hero").getByRole("button", { name: enMessages.homepage.hero.plannerCta });
	const dialog = page.getByRole("dialog").filter({ has: page.getByRole("progressbar") });
	await expect(async () => {
		if (!(await dialog.isVisible())) await trigger.click();
		await expect(dialog).toBeVisible({ timeout: DIALOG_OPEN_TIMEOUT });
	}).toPass();

	return dialog;
};

interface FinishQuickStartParams {
	page: Page;
	dialog: Locator;
}

export const finishQuickStart = async ({ page, dialog }: FinishQuickStartParams) => {
	await dialog.getByRole("button", { name: enMessages.quickStart.finish }).click();
	await expect(page).toHaveURL(/\/planner$/, { timeout: PLANNER_NAVIGATION_TIMEOUT });
};
