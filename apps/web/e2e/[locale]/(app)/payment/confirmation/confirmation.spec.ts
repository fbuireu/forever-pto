import { ES } from "@infrastructure/i18n/locales";
import type { RoutePath } from "@infrastructure/seo/routes";
import { expect, test } from "../../../../fixtures";

const CONFIRMATION_PATH = "/payment/confirmation" satisfies RoutePath;

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
