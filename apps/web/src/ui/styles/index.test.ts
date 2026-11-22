import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string): string => readFileSync(join(__dirname, file), "utf8");

const RELATIVE_IMPORT = /@import\s+["'](\.{1,2}\/[^"']+)["']/g;

const stylesheetsUnder = (folder: string): string[] =>
	readdirSync(join(__dirname, folder), { withFileTypes: true }).flatMap((entry) => {
		const path = join(folder, entry.name);
		if (entry.isDirectory()) return stylesheetsUnder(path);
		return entry.name.endsWith(".css") ? [path] : [];
	});

const reachableFrom = (entry: string): Set<string> => {
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

describe("the safe-area utilities", () => {
	const tailwind = createRequire(
		createRequire(join(__dirname, "../../../package.json")).resolve("@tailwindcss/postcss"),
	);
	const { compile } = tailwind("@tailwindcss/node");

	const built = async (candidates: string[]): Promise<string> => {
		const css = `@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
${read("utilities/index.css")}`;
		const compiler = await compile(css, { base: __dirname, onDependency() {} });
		return compiler.build(candidates) as string;
	};

	it("pads both sides by the spacing step or the side inset, whichever is larger", async () => {
		const css = await built(["px-safe-7", "px-safe-4"]);

		expect(css).toContain("padding-left: max(calc(var(--spacing) * 7), env(safe-area-inset-left));");
		expect(css).toContain("padding-right: max(calc(var(--spacing) * 7), env(safe-area-inset-right));");
		expect(css).toContain("padding-left: max(calc(var(--spacing) * 4), env(safe-area-inset-left));");
	});

	it("pads all four sides the same way", async () => {
		const css = await built(["p-safe-4"]);

		for (const side of ["top", "right", "bottom", "left"])
			expect(css).toContain(`padding-${side}: max(calc(var(--spacing) * 4), env(safe-area-inset-${side}));`);
	});

	it("emits nothing for a step that is not an integer", async () => {
		expect(await built(["px-safe-foo"])).not.toContain("safe-area-inset");
	});

	it("leaves a variant override of the same side after the utility, so it wins", async () => {
		const css = await built(["px-safe-7", "in-data-[slot=sidebar-inset]:pl-7"]);

		expect(css.indexOf("env(safe-area-inset-left)")).toBeLessThan(css.indexOf("data-slot"));
	});
});
