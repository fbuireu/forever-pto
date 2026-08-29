import { describe, expect, it } from "vitest";
import { contentLine } from "./sanitizer";

const CONTINUATION = "\r\n ";

describe("contentLine", () => {
	it("joins the property name to its value", () => {
		expect(contentLine({ name: "SUMMARY", value: "New Year" })).toBe("SUMMARY:New Year");
	});

	it.each([
		[";", String.raw`\;`],
		[",", String.raw`\,`],
		["\\", "\\\\"],
	])("escapes %s, which would otherwise end the value", (character, escaped) => {
		expect(contentLine({ name: "SUMMARY", value: `a${character}b` })).toBe(`SUMMARY:a${escaped}b`);
	});

	it.each([["\n"], ["\r"], ["\r\n"]])("turns a pasted line break into the literal \\n", (breakChar) => {
		expect(contentLine({ name: "SUMMARY", value: `a${breakChar}b` })).toBe(String.raw`SUMMARY:a\nb`);
	});

	it("leaves a line at or under 75 octets unfolded", () => {
		const line = contentLine({ name: "SUMMARY", value: "x".repeat(67) });
		expect(line).toHaveLength(75);
		expect(line).not.toContain(CONTINUATION);
	});

	it("folds a longer line onto continuation lines a strict parser will accept", () => {
		const line = contentLine({ name: "SUMMARY", value: "x".repeat(200) });
		const segments = line.split(CONTINUATION);

		expect(segments.length).toBeGreaterThan(1);
		for (const segment of segments) {
			expect(new TextEncoder().encode(segment).length).toBeLessThanOrEqual(75);
		}
		expect(segments.join("").replace(/^SUMMARY:/, "")).toBe("x".repeat(200));
	});

	it("counts octets rather than characters, so multi-byte names fold correctly", () => {
		const line = contentLine({ name: "SUMMARY", value: "é".repeat(80) });

		for (const segment of line.split(CONTINUATION)) {
			expect(new TextEncoder().encode(segment).length).toBeLessThanOrEqual(75);
		}
	});
});
