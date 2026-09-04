import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const APP_UI = join(import.meta.dirname, "..", "..", "web", "src", "ui");

const CORE_BUTTON = join(APP_UI, "modules", "core", "primitives", "Button.tsx");
const HOMEPAGE_SHARED = join(APP_UI, "modules", "pages", "homepage", "sections", "shared.ts");

const probeClass = (file: string, pattern: RegExp): string => {
	const match = pattern.exec(readFileSync(file, "utf8"));

	if (!match) {
		throw new Error(`${file} no longer carries ${pattern}; pick a class this package's own sources do not name`);
	}

	return match[0];
};

test("the core @source still generates the utilities only the app names", async ({ page }) => {
	const probe = probeClass(CORE_BUTTON, /tracking-\[[^\]]+\]/);

	await page.goto("/design-system/components/button/");
	const button = page.locator('[data-slot="button"]').first();
	await expect(button).toBeVisible();

	await expect(button, `${probe} is the probe, so it has to be on the element`).toHaveClass(
		new RegExp(probe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
	);

	const letterSpacing = await button.evaluate((element) => getComputedStyle(element).letterSpacing);
	expect(letterSpacing, `${probe} produced no rule, so the @source reaches nothing`).not.toBe("normal");
});

test("the homepage-patterns @source still generates brutCard's utilities", async ({ page }) => {
	const probe = probeClass(HOMEPAGE_SHARED, /\[contain:[^\]]+\]/);

	await page.goto("/design-system/patterns/homepage/");
	const card = page.locator(`[class*="${probe}"]`).first();
	await expect(card).toBeVisible();

	const contain = await card.evaluate((element) => getComputedStyle(element).contain);
	expect(contain, `${probe} produced no rule, so the @source reaches nothing`).not.toBe("none");
});
