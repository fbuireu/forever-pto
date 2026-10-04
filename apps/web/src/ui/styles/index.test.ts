import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(__dirname, file), "utf8");

const RELATIVE_IMPORT = /@import\s+["'](\.{1,2}\/[^"']+)["']/g;

const stylesheetsUnder = (folder: string): string[] =>
	readdirSync(join(__dirname, folder), { withFileTypes: true }).flatMap((entry) => {
		const path = join(folder, entry.name);
		if (entry.isDirectory()) return stylesheetsUnder(path);
		return entry.name.endsWith(".css") ? [path] : [];
	});

const reachableFrom = (entry: string) => {
	const reached = new Set<string>();
	const queue = [entry];
	for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
		if (reached.has(file)) continue;
		reached.add(file);
		for (const [, target] of read(file).matchAll(RELATIVE_IMPORT)) queue.push(join(dirname(file), target));
	}
	return reached;
};

const entry = read("index.css");
const tokens = read("global/index.css");
const theme = read("theme/index.css");

const declaredLayers =
	entry
		.match(/^@layer\s+([^;{]+);/m)?.[1]
		.split(",")
		.map((layer) => layer.trim()) ?? [];

describe("cascade layer order", () => {
	it("reserves no slot for the design tokens, which stay unlayered on purpose", () => {
		expect(declaredLayers).not.toContain("global");
		expect(tokens).not.toMatch(/@layer/);
	});

	it("keeps the tutorial reservation ahead of the driver.js import that fills it", () => {
		expect(declaredLayers).toContain("tutorial");
	});
});

describe("the reduced-motion block", () => {
	const block = read("animations/index.css").match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\t\}/)?.[1];
	const MOTION_PANELS = {
		"collapsible-content": "../modules/core/animate/base/Collapsible.tsx",
		"accordion-panel": "../modules/core/animate/base/Accordion.tsx",
	};

	it("lets the panels motion animates out of its durations, so Base UI never reads a CSS animation and a transition on one", () => {
		const exempted = [...(block ?? "").matchAll(/\[data-slot="([^"]+)"\][^{]*?(?=[,{])/g)].map(([, slot]) => slot);
		const rule = (block ?? "").match(/\[data-slot="[^{]+\{([^}]*)\}/)?.[1] ?? "";

		expect(block).toBeDefined();
		expect(exempted).toEqual(Object.keys(MOTION_PANELS));
		expect(rule).toMatch(/animation-duration:\s*0s\s*!important/);
		expect(rule).toMatch(/transition-duration:\s*0s\s*!important/);
	});

	it.each(Object.entries(MOTION_PANELS))("names %s, the slot %s renders its panel under", (slot, source) => {
		expect(read(source)).toContain(`data-slot="${slot}"`);
	});
});

describe("theme tokens", () => {
	it("leaves max-w-8xl resolving from the --container-* namespace alone", () => {
		expect(theme).toMatch(/--container-8xl:/);
		expect(theme).not.toMatch(/--max-width-8xl:/);
	});
});

describe("what this folder holds", () => {
	it("holds only cross-cutting CSS: the entry reaches every stylesheet here, so none belongs to one component", () => {
		const stylesheets = stylesheetsUnder(".");
		const reached = reachableFrom("index.css");

		expect(stylesheets.length).toBeGreaterThan(5);
		expect(stylesheets.filter((file) => !reached.has(file))).toEqual([]);
	});
});
