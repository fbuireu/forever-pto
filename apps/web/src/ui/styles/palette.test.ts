import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BONES_COLORS, STRIPE_DARK_PALETTE, STRIPE_LIGHT_PALETTE } from "./palette";

const read = (file: string) => readFileSync(join(__dirname, file), "utf8");

const LIGHT_BLOCK = /^:root\s*\{([\s\S]*?)^\}/m;
const DARK_BLOCK = /^\[data-theme="dark"\]\s*\{([\s\S]*?)^\}/m;
const DECLARATION = /^\s*(--[\w-]+)\s*:\s*([^;]+);/gm;
const VARIABLE_REFERENCE = /^var\((--[\w-]+)\)$/;

const declarationsOf = (block: string) =>
	new Map([...block.matchAll(DECLARATION)].map(([, name, value]) => [name, value.trim()]));

const tokens = read("global/index.css");
const light = declarationsOf(tokens.match(LIGHT_BLOCK)?.[1] ?? "");
const dark = declarationsOf(tokens.match(DARK_BLOCK)?.[1] ?? "");

type Theme = "light" | "dark";

const resolve = ({ theme, name }: { theme: Theme; name: string }): string => {
	const value = (theme === "dark" ? dark.get(name) : undefined) ?? light.get(name);
	if (value === undefined) throw new Error(`${name} is declared in neither theme`);
	const reference = value.match(VARIABLE_REFERENCE);

	return reference ? resolve({ theme, name: reference[1] }) : value;
};

const STRIPE_TOKENS = {
	light: {
		surface: "--surface-panel",
		panel: "--surface-panel-alt",
		field: "--surface-panel",
		fieldHover: "--surface-panel-alt",
		foreground: "--foreground",
		frame: "--frame",
		primaryForeground: "--primary-foreground",
		accent: "--accent",
		destructive: "--destructive",
		muted: "--muted-foreground",
		ring: "--ring",
	},
	dark: {
		surface: "--surface-panel",
		panel: "--sidebar",
		field: "--surface-panel",
		fieldHover: "--surface-panel-alt",
		foreground: "--foreground",
		frame: "--frame",
		primaryForeground: "--primary-foreground",
		accent: "--accent",
		destructive: "--destructive",
		muted: "--muted-foreground",
		ring: "--ring",
	},
} as const;

const BONES_TOKENS = {
	color: { theme: "light", name: "--surface-panel-soft" },
	darkColor: { theme: "dark", name: "--surface-panel-soft" },
	shimmerColor: { theme: "light", name: "--surface-panel" },
	darkShimmerColor: { theme: "dark", name: "--surface-panel-alt" },
} as const;

const HEX_COLOUR = /#[0-9a-f]{3,8}\b/i;
const lowercased = <T extends Record<string, string>>(record: T) =>
	Object.fromEntries(Object.entries(record).map(([key, value]) => [key, value.toLowerCase()]));

describe("the palette module", () => {
	it("reads both theme blocks of the token file", () => {
		expect(light.size).toBeGreaterThan(50);
		expect(dark.size).toBeGreaterThan(20);
	});

	it.each([
		["light", STRIPE_LIGHT_PALETTE],
		["dark", STRIPE_DARK_PALETTE],
	] as const)("hands Stripe the %s tokens, because the iframe cannot read a custom property", (theme, palette) => {
		const expected = Object.fromEntries(
			Object.entries(STRIPE_TOKENS[theme]).map(([role, name]) => [role, resolve({ theme, name })]),
		);

		expect(lowercased(palette)).toEqual(lowercased(expected));
	});

	it("hands the skeletons the surface tokens, because boneyard-js computes with the colour", () => {
		const expected = Object.fromEntries(
			Object.entries(BONES_TOKENS).map(([key, { theme, name }]) => [key, resolve({ theme, name })]),
		);

		expect(lowercased(BONES_COLORS)).toEqual(lowercased(expected));
	});

	it("keeps every skeleton colour out of boneyard.config.json and the registry the CLI generates from it", () => {
		const config = readFileSync(join(__dirname, "../../../boneyard.config.json"), "utf8");
		const registry = readFileSync(join(__dirname, "../modules/bones/registry.ts"), "utf8");

		expect(Object.keys(JSON.parse(config)).filter((key) => key in BONES_COLORS)).toEqual([]);
		expect(config.match(HEX_COLOUR)).toBeNull();
		expect(registry.match(HEX_COLOUR)).toBeNull();
	});

	it("catches a Stripe colour that drifts from its token", () => {
		const drifted = { ...STRIPE_LIGHT_PALETTE, surface: STRIPE_LIGHT_PALETTE.panel };
		const expected = Object.fromEntries(
			Object.entries(STRIPE_TOKENS.light).map(([role, name]) => [role, resolve({ theme: "light", name })]),
		);

		expect(lowercased(drifted)).not.toEqual(lowercased(expected));
	});
});
