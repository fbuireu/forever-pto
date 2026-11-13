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
const INK_CLASS = /(?<![\w-])text-(?:\[var\((--[\w-]+)\)\]|(day-[\w-]+-ink))/;
const MIX = /^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+?)\s+(\d+)%\)$/;
const FUNCTION_RGBA = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/;
const GRADIENT = /^linear-gradient\((.+)\)$/;
const OKLCH = /^oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)%)?\)$/;
const BANNER_SCHEME = /bg:\s*"bg-(wash-[\w-]+)",[\s\S]*?title:\s*"text-(wash-[\w-]+)"/g;
const METRIC_CARD_SCHEME =
	/(\w+):\s*\{\s*bg:\s*"bg-(wash-[\w-]+)",[^}]*?text:\s*"text-(wash-[\w-]+)",\s*badge:\s*"bg-(wash-[\w-]+) text-(wash-[\w-]+)"/g;

const AA = 4.5;
const BRAND_FILLED = ["holiday", "suggested", "alternative", "custom", "manual"] as const;
const DAY_STATES_BY_THEME = ["light", "dark"] as const;

type Theme = (typeof DAY_STATES_BY_THEME)[number];
type Colour = [number, number, number];

const tokens = readFileSync(join(__dirname, "global/index.css"), "utf8");
const declarationsOf = (block: string): Map<string, string> =>
	new Map([...block.matchAll(DECLARATION)].map(([, name, value]) => [name as string, (value as string).trim()]));
const light = declarationsOf(tokens.match(LIGHT_BLOCK)?.[1] ?? "");
const dark = declarationsOf(tokens.match(DARK_BLOCK)?.[1] ?? "");

const topLevelParts = (list: string): string[] => {
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

const encoded = (channel: number): number => {
	const clamped = Math.min(1, Math.max(0, channel));
	return 255 * (clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055);
};

interface OklchParams {
	lightness: number;
	chroma: number;
	hue: number;
}

const oklchToColour = ({ lightness, chroma, hue }: OklchParams): Colour => {
	const a = chroma * Math.cos((hue * Math.PI) / 180);
	const b = chroma * Math.sin((hue * Math.PI) / 180);
	const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		encoded(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		encoded(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		encoded(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
	];
};

const hexToColour = (hex: string): Colour => {
	const digits = hex.slice(1);
	return [0, 2, 4].map((at) => Number.parseInt(digits.slice(at, at + 2), 16)) as Colour;
};

interface ColoursOfParams {
	theme: Theme;
	value: string;
	backdrop?: Colour;
}

const coloursOf = ({ theme, value, backdrop }: ColoursOfParams): Colour[] => {
	const text = value.trim();
	const reference = text.match(/^var\((--[\w-]+)\)$/)?.[1];
	if (reference) {
		const resolved = (theme === "dark" ? dark.get(reference) : undefined) ?? light.get(reference);
		if (resolved === undefined) throw new Error(`${reference} is declared in neither theme`);
		return coloursOf({ theme, value: resolved, backdrop });
	}
	if (text === "white") return [[255, 255, 255]];
	if (text === "black") return [[0, 0, 0]];
	if (text.startsWith("#")) return [hexToColour(text)];

	const oklch = text.match(OKLCH);
	if (oklch) {
		const solid = oklchToColour({ lightness: Number(oklch[1]) / 100, chroma: Number(oklch[2]), hue: Number(oklch[3]) });
		if (oklch[4] === undefined) return [solid];
		if (!backdrop) throw new Error(`${text} is translucent and needs a backdrop`);
		const alpha = Number(oklch[4]) / 100;
		return [solid.map((channel, at) => channel * alpha + backdrop[at] * (1 - alpha)) as Colour];
	}

	const gradient = text.match(GRADIENT)?.[1];
	if (gradient)
		return topLevelParts(gradient)
			.slice(1)
			.flatMap((stop) => coloursOf({ theme, value: stop, backdrop }));

	const mix = text.match(MIX);
	if (mix) {
		const [, first, firstShare, second, secondShare] = mix as unknown as [string, string, string, string, string];
		const [a] = coloursOf({ theme, value: first, backdrop });
		const [b] = coloursOf({ theme, value: second, backdrop });
		const total = Number(firstShare) + Number(secondShare);
		return [
			(a as Colour).map(
				(channel, at) => (channel * Number(firstShare) + (b as Colour)[at] * Number(secondShare)) / total,
			) as Colour,
		];
	}
	throw new Error(`no colour to read in ${text}`);
};

const linear = (channel: number): number => {
	const share = channel / 255;
	return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
};

const luminance = ([red, green, blue]: Colour): number =>
	0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);

interface ContrastParams {
	foreground: Colour;
	background: Colour;
}

const contrast = ({ foreground, background }: ContrastParams): number => {
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

const inkOf = (classes: string): string => {
	const match = classes.match(INK_CLASS);
	const token = match?.[1] ?? (match?.[2] ? `--${match[2]}` : undefined);
	if (!token) throw new Error(`no ink in ${classes}`);
	return token;
};

const INK_BY_DAY: Record<(typeof BRAND_FILLED)[number], string> = {
	holiday: "--day-holiday-ink",
	suggested: "--color-brand-ink",
	alternative: "--color-brand-ink",
	custom: "--day-holiday-ink",
	manual: "--color-brand-ink",
};

const fillOf = (classes: string): string => {
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

	it.each(BRAND_FILLED)("reads a %s day in the ink its fill pairs with", (name) => {
		expect(inkOf(MODIFIERS_CLASS_NAMES[name])).toBe(INK_BY_DAY[name]);
	});

	it("declares the holiday ink in both themes, since the holiday fill flips with them", () => {
		expect(light.has("--day-holiday-ink")).toBe(true);
		expect(dark.has("--day-holiday-ink")).toBe(true);
		expect(dark.has("--day-holiday")).toBe(true);
	});

	it.each(DAY_STATES_BY_THEME.flatMap((theme) => BRAND_FILLED.map((name) => [theme, name] as const)))(
		"reads at AA on a %s-theme %s day, stripes included",
		(theme, name) => {
			const classes = MODIFIERS_CLASS_NAMES[name];
			const [ink = [0, 0, 0] as Colour] = coloursOf({ theme, value: `var(${inkOf(classes)})` });
			const fills = coloursOf({ theme, value: fillOf(classes) });
			const stripe = classes.match(STRIPE)?.[1];
			const painted = stripe ? [...fills, ...fills.map((base) => overlaid({ theme, base, stripe }))] : fills;

			expect(painted.length).toBeGreaterThan(0);
			expect(painted.filter((background) => contrast({ foreground: ink, background }) < AA)).toEqual([]);
		},
	);

	it("fails the cream a dark page inherits on the Manual Day fill, which is the pairing the ink replaces", () => {
		const [cream = [0, 0, 0] as Colour] = coloursOf({ theme: "dark", value: "var(--foreground)" });
		const fills = coloursOf({ theme: "dark", value: fillOf(MODIFIERS_CLASS_NAMES.manual) });

		expect(fills).toHaveLength(1);
		expect(fills.map((background) => contrast({ foreground: cream, background }) < AA)).toEqual([true]);
	});
});

const bannerSchemes = [
	...readFileSync(join(__dirname, "../modules/core/primitives/Banner.tsx"), "utf8").matchAll(BANNER_SCHEME),
].map(([, wash, title]) => [wash as string, title as string] as const);

describe("the title on a Banner's wash", () => {
	it("reads every colour scheme out of Banner.tsx", () => {
		expect(bannerSchemes.length).toBeGreaterThanOrEqual(3);
	});

	it.each(DAY_STATES_BY_THEME.flatMap((theme) => bannerSchemes.map(([wash, title]) => [theme, title, wash] as const)))(
		"reads at AA in the %s theme: %s on %s",
		(theme, title, wash) => {
			const [foreground = [0, 0, 0] as Colour] = coloursOf({ theme, value: `var(--${title})` });
			const [background = [0, 0, 0] as Colour] = coloursOf({ theme, value: `var(--${wash})` });

			expect(contrast({ foreground, background })).toBeGreaterThanOrEqual(AA);
		},
	);
});

const metricCardSchemes = [
	...readFileSync(join(__dirname, "../modules/pages/planner/summary/MetricCard.tsx"), "utf8").matchAll(
		METRIC_CARD_SCHEME,
	),
].map(([, scheme, wash, text, badge, badgeInk]) => ({
	scheme: scheme as string,
	pairs: [
		[text as string, wash as string],
		[badgeInk as string, badge as string],
	] as const,
}));

describe("the text and the badge on a MetricCard's wash", () => {
	it("reads every colour scheme out of MetricCard.tsx", () => {
		expect(metricCardSchemes.map(({ scheme }) => scheme)).toEqual([
			"blue",
			"green",
			"purple",
			"amber",
			"emerald",
			"cyan",
			"violet",
			"rose",
		]);
	});

	it.each(
		DAY_STATES_BY_THEME.flatMap((theme) =>
			metricCardSchemes.flatMap(({ scheme, pairs }) =>
				pairs.map(([ink, surface]) => [theme, scheme, ink, surface] as const),
			),
		),
	)("reads at AA in the %s theme, %s scheme: %s on %s", (theme, _scheme, ink, surface) => {
		const [card = [0, 0, 0] as Colour] = coloursOf({ theme, value: "var(--card)" });
		const [background = [0, 0, 0] as Colour] = coloursOf({ theme, value: `var(--${surface})`, backdrop: card });
		const [foreground = [0, 0, 0] as Colour] = coloursOf({ theme, value: `var(--${ink})`, backdrop: background });

		expect(contrast({ foreground, background })).toBeGreaterThanOrEqual(AA);
	});
});
