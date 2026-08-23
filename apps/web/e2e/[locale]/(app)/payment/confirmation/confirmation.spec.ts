import { ES } from "@infrastructure/i18n/locales";
import { expect, test } from "@playwright/test";

const CONFIRMATION_PATH = "/payment/confirmation";

test.describe("(app) payment/confirmation", () => {
	test("redirects to the same-origin home when no payment_intent param", async ({ page, baseURL }) => {
		await page.goto(CONFIRMATION_PATH);

		const landed = new URL(page.url());
		const expected = new URL("/", baseURL);
		expect(landed.origin).toBe(expected.origin);
		expect(landed.pathname).toBe(expected.pathname);
	});

	test("locale-prefixed confirmation redirects to the same-origin locale home", async ({ page, baseURL }) => {
		await page.goto(`/${ES}${CONFIRMATION_PATH}`);

		const landed = new URL(page.url());
		const expected = new URL(`/${ES}`, baseURL);
		expect(landed.origin).toBe(expected.origin);
		expect(landed.pathname).toBe(expected.pathname);
	});
});
