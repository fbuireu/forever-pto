import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(__dirname, file), "utf8");

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

describe("theme tokens", () => {
	it("leaves max-w-8xl resolving from the --container-* namespace alone", () => {
		expect(theme).toMatch(/--container-8xl:/);
		expect(theme).not.toMatch(/--max-width-8xl:/);
	});
});
