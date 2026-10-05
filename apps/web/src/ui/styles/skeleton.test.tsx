import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MODULES = "../modules";
const BONES_FOLDER = `${MODULES}/bones`;
const UNWRAPPED = /\[data-boneyard[^\]]*\][^{}]*\{[^}]*display:\s*contents/;

const read = (file: string) => readFileSync(join(__dirname, file), "utf8");

const stylesheetsUnder = (folder: string): string[] =>
	readdirSync(join(__dirname, folder), { withFileTypes: true }).flatMap((entry) => {
		const path = `${folder}/${entry.name}`;
		if (entry.isDirectory()) return stylesheetsUnder(path);
		return entry.name.endsWith(".css") ? [path] : [];
	});

const stylesheets = [...stylesheetsUnder("."), ...stylesheetsUnder(MODULES)];

describe("the wrapper boneyard-js puts around a skeleton's content", () => {
	it("is a box the capture can measure, since a display: contents element has no rectangle", () => {
		const offenders = stylesheets.filter((file) => UNWRAPPED.test(read(file)));

		expect(stylesheets.length).toBeGreaterThan(8);
		expect(offenders).toStrictEqual([]);
	});

	it("reads the rules that would take its box away, in either spelling of the selector", () => {
		expect(UNWRAPPED.test("[data-boneyard] > div:not([data-boneyard-overlay]) {\n\tdisplay: contents;\n}")).toBe(true);
		expect(UNWRAPPED.test("[data-boneyard] > [data-boneyard-content] { display: contents }")).toBe(true);
		expect(UNWRAPPED.test(".card { display: contents }\n[data-boneyard] { position: relative }")).toBe(false);
	});
});

interface RecordedBreakpoint {
	width: number;
	height: number;
	bones: [number, number, number, number, number | string, boolean?][];
}

interface Registered {
	name: string;
	breakpoints: Record<string, RecordedBreakpoint>;
}

const registered: Registered[] = readdirSync(join(__dirname, BONES_FOLDER))
	.filter((file) => file.endsWith(".bones.json"))
	.map((file) => ({ name: file.replace(".bones.json", ""), ...JSON.parse(read(`${BONES_FOLDER}/${file}`)) }));

const breakpointsOf = ({ name, breakpoints }: Registered) =>
	Object.entries(breakpoints).map(([viewport, breakpoint]) => ({ name, viewport, breakpoint }));

const EDGE_TOLERANCE = 1;

describe("the skeletons the registry draws", () => {
	it("holds the three the planner requests by name, each captured at several viewport widths", () => {
		expect(registered.map(({ name }) => name).sort()).toStrictEqual(["calendar-list", "planner-panel", "summary"]);
		expect(registered.every(({ breakpoints }) => Object.keys(breakpoints).length >= 4)).toBe(true);
	});

	it.each(
		registered.flatMap(breakpointsOf).map((row) => [`${row.name} at ${row.viewport}px`, row.breakpoint] as const),
	)(
		"%s is made of boxes with a width, laid inside the container they were measured in",
		(_label, { width, height, bones }) => {
			const outside = bones.filter(
				([x, y, w, h]) =>
					w <= 0 || h <= 0 || x < 0 || x + w > 100 + EDGE_TOLERANCE || y < 0 || y + h > height + EDGE_TOLERANCE,
			);

			expect(width).toBeGreaterThan(0);
			expect(bones.length).toBeGreaterThan(5);
			expect(outside).toStrictEqual([]);
		},
	);
});
