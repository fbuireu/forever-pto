import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MODIFIERS_CLASS_NAMES } from "@ui/modules/pages/planner/calendar/utils/helpers";
import { describe, expect, it } from "vitest";

const LIGHT_BLOCK = /^:root\s*\{([\s\S]*?)^\}/m;
const DARK_BLOCK = /^\[data-theme="dark"\]\s*\{([\s\S]*?)^\}/m;
const DECLARATION = /^\s*(--[\w-]+)\s*:\s*([^;]+);/gm;
const ARBITRARY_FILL = /(?<![\w-])bg-\[(?:image:|color:)?([^\]]+)\]/;
const NAMED_FILL = /(?<![\w-])bg-(day-[\w-]+)/;
const STRIPE = /var\((--stripe-[\w-]+)\)/;
const INK_CLASS = /(?<![\w-])text-\[var\((--[\w-]+)\)\]/;
const MIX = /^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+?)\s+(\d+)%\)$/;
const FUNCTION_RGBA = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/;
const GRADIENT = /^linear-gradient\((.+)\)$/;

const AA = 4.5;
const BRAND_FILLED = ["holiday", "suggested", "alternative", "custom", "manuallySelected"] as const;
const DAY_STATES_BY_THEME = ["light", "dark"] as const;

type Theme = (typeof DAY_STATES_BY_THEME)[number];
type Colour = [number, number, number];

const tokens = readFileSync(join(__dirname, "global/index.css"), "utf8");
const declarationsOf = (block: string) =>
	new Map([...block.matchAll(DECLARATION)].map(([, name, value]) => [name as string, (value as string).trim()]));
const light = declarationsOf(tokens.match(LIGHT_BLOCK)?.[1] ?? "");
const dark = declarationsOf(tokens.match(DARK_BLOCK)?.[1] ?? "");

const topLevelParts = (list: string) => {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;
	for (let at = 0; at < list.length; at += 1) {
		if (list[at] === "(") depth += 1;
		if (list[at] === ")") depth -= 1;
		if (list[at] === "," && depth === 0) {
			parts.push(list.slice(start, at).trim());
			start = at + 1;
		}
	}
	return [...parts, list.slice(start).trim()];
};

const hexToColour = (hex: string): Colour => {
	const digits = hex.slice(1);
	return [0, 2, 4].map((at) => Number.parseInt(digits.slice(at, at + 2), 16)) as Colour;
};

interface ColoursOfParams {
	theme: Theme;
	value: string;
}

const coloursOf = ({ theme, value }: ColoursOfParams): Colour[] => {
	const text = value.trim();
	const reference = text.match(/^var\((--[\w-]+)\)$/)?.[1];
	if (reference) {
		const resolved = (theme === "dark" ? dark.get(reference) : undefined) ?? light.get(reference);
		if (resolved === undefined) throw new Error(`${reference} is declared in neither theme`);
		return coloursOf({ theme, value: resolved });
	}
	if (text === "white") return [[255, 255, 255]];
	if (text === "black") return [[0, 0, 0]];
	if (text.startsWith("#")) return [hexToColour(text)];

	const gradient = text.match(GRADIENT)?.[1];
	if (gradient)
		return topLevelParts(gradient)
			.slice(1)
			.flatMap((stop) => coloursOf({ theme, value: stop }));

	const mix = text.match(MIX);
	if (mix) {
		const [, first, firstShare, second, secondShare] = mix as unknown as [string, string, string, string, string];
		const [a] = coloursOf({ theme, value: first });
		const [b] = coloursOf({ theme, value: second });
		const total = Number(firstShare) + Number(secondShare);
		return [
			(a as Colour).map(
				(channel, at) => (channel * Number(firstShare) + (b as Colour)[at] * Number(secondShare)) / total,
			) as Colour,
		];
	}
	throw new Error(`no colour to read in ${text}`);
};

const linear = (channel: number) => {
	const share = channel / 255;
	return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
};

const luminance = ([red, green, blue]: Colour) => 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);

interface ContrastParams {
	foreground: Colour;
	background: Colour;
}

const contrast = ({ foreground, background }: ContrastParams) => {
	const [lighter = 0, darker = 0] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
	return (lighter + 0.05) / (darker + 0.05);
};

interface OverlaidParams {
	theme: Theme;
	base: Colour;
	stripe: string;
}

const overlaid = ({ theme, base, stripe }: OverlaidParams): Colour => {
	const rgba = (theme === "dark" ? dark.get(stripe) : undefined) ?? light.get(stripe) ?? "";
	const match = rgba.match(FUNCTION_RGBA);
	if (!match) throw new Error(`${stripe} is not an rgba() token`);
	const alpha = Number(match[4] ?? 1);
	return base.map((channel, at) => channel * (1 - alpha) + Number(match[at + 1]) * alpha) as Colour;
};

const fillOf = (classes: string) => {
	const arbitrary = classes.match(ARBITRARY_FILL)?.[1];
	if (arbitrary) return arbitrary.replaceAll("_", " ");
	const named = classes.match(NAMED_FILL)?.[1];
	if (named) return `var(--${named})`;
	throw new Error(`no fill in ${classes}`);
};

describe("the ink on a brand-filled day", () => {
	it("reads both theme blocks of the token file", () => {
		expect(light.size).toBeGreaterThan(50);
		expect(dark.size).toBeGreaterThan(20);
	});

	it("keeps the ink and every brand hue the days are filled with at one value in both themes, which is why the ink needs no pair", () => {
		const brand = [...light.keys()].filter((name) => name.startsWith("--color-brand-"));

		expect(brand.length).toBeGreaterThan(8);
		expect(brand.filter((name) => dark.has(name))).toEqual([]);
	});

	it.each(BRAND_FILLED)("reads a %s day in a token that is the ink", (name) => {
		const token = MODIFIERS_CLASS_NAMES[name].match(INK_CLASS)?.[1];

		expect(token).toBe("--color-brand-ink");
	});

	it.each(DAY_STATES_BY_THEME.flatMap((theme) => BRAND_FILLED.map((name) => [theme, name] as const)))(
		"reads at AA on a %s-theme %s day, stripes included",
		(theme, name) => {
			const classes = MODIFIERS_CLASS_NAMES[name];
			const [ink = [0, 0, 0] as Colour] = coloursOf({ theme, value: "var(--color-brand-ink)" });
			const fills = coloursOf({ theme, value: fillOf(classes) });
			const stripe = classes.match(STRIPE)?.[1];
			const painted = stripe ? [...fills, ...fills.map((base) => overlaid({ theme, base, stripe }))] : fills;

			expect(painted.length).toBeGreaterThan(0);
			expect(painted.filter((background) => contrast({ foreground: ink, background }) < AA)).toEqual([]);
		},
	);

	it("fails the cream a dark page inherits on the Manual Day fill, which is the pairing the ink replaces", () => {
		const [cream = [0, 0, 0] as Colour] = coloursOf({ theme: "dark", value: "var(--foreground)" });
		const fills = coloursOf({ theme: "dark", value: fillOf(MODIFIERS_CLASS_NAMES.manuallySelected) });

		expect(fills).toHaveLength(1);
		expect(fills.map((background) => contrast({ foreground: cream, background }) < AA)).toEqual([true]);
	});
});
