import enMessages from "@i18n/messages/en.json";
import { expect, type Locator, type Page } from "@playwright/test";

const DIALOG_OPEN_TIMEOUT = 3_000;
const PLANNER_NAVIGATION_TIMEOUT = 60_000;

interface QuickStartParams {
	page: Page;
}

export const openQuickStart = async ({ page }: QuickStartParams): Promise<Locator> => {
	await page.goto("/");
	await page.context().addCookies([{ name: "user-country", value: "es", url: page.url() }]);
	await page.reload();

	const trigger = page.locator("#hero").getByRole("button", { name: enMessages.homepage.hero.plannerCta });
	const dialog = page.getByRole("dialog").filter({ has: page.getByRole("progressbar") });
	await expect(async () => {
		if (!(await dialog.isVisible())) await trigger.click();
		await expect(dialog).toBeVisible({ timeout: DIALOG_OPEN_TIMEOUT });
	}).toPass();

	return dialog;
};

interface FinishQuickStartParams extends QuickStartParams {
	dialog: Locator;
}

export const finishQuickStart = async ({ page, dialog }: FinishQuickStartParams) => {
	await dialog.getByRole("button", { name: enMessages.quickStart.finish }).click();
	await expect(page).toHaveURL(/\/planner$/, { timeout: PLANNER_NAVIGATION_TIMEOUT });
};
