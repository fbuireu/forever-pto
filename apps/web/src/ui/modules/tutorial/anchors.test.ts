import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TUTORIAL_ANCHOR, tutorialSelector } from "./anchors";

const UI_ROOT = resolve(__dirname, "../..");
const ANCHOR_ATTRIBUTE = /data-tutorial=\{TUTORIAL_ANCHOR\.([A-Z0-9_]+)\}/g;

const componentFiles = (directory: string): string[] =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return componentFiles(path);
		return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx") ? [path] : [];
	});

const rendered = new Set(
	componentFiles(UI_ROOT).flatMap((path) =>
		[...readFileSync(path, "utf8").matchAll(ANCHOR_ATTRIBUTE)].map(([, key]) => key),
	),
);

describe("tutorial anchors", () => {
	it("renders every anchor the tour targets, so no step lands on the dummy element", () => {
		expect(rendered.size).toBeGreaterThan(5);
		expect(Object.keys(TUTORIAL_ANCHOR).filter((key) => !rendered.has(key))).toEqual([]);
	});

	it("declares no anchor the tour never targets", () => {
		expect([...rendered].filter((key) => !(key in TUTORIAL_ANCHOR))).toEqual([]);
	});

	it("builds a selector driver.js can match", () => {
		expect(tutorialSelector(TUTORIAL_ANCHOR.CALENDAR_LIST)).toBe('[data-tutorial="calendar-list"]');
	});
});
