import { describe, expect, it } from "vitest";
import { normalizeCountryCode, stringField, TOR_COUNTRY, UNIDENTIFIED_COUNTRY } from "./normalize";

describe("normalizeCountryCode", () => {
	it("lower-cases a valid code", () => {
		expect(normalizeCountryCode("ES")).toBe("es");
	});

	it("trims before deciding, because the CDN trace carries a line ending", () => {
		expect(normalizeCountryCode("  DE \n")).toBe("de");
	});

	it.each([[UNIDENTIFIED_COUNTRY], [TOR_COUNTRY], ["xx"], ["t1"]])(
		"rejects %s, which is a signal rather than a Country",
		(sentinel) => {
			expect(normalizeCountryCode(sentinel)).toBe("");
		},
	);

	it.each([["ESP"], ["E"], ["12"], ["e5"], ["<script>"], [""], [null], [undefined]])(
		"rejects %o rather than letting it reach the Holiday lookup",
		(malformed) => {
			expect(normalizeCountryCode(malformed)).toBe("");
		},
	);
});

describe("stringField", () => {
	it("reads a string field off a JSON object", () => {
		expect(stringField({ body: { ip: "1.2.3.4" }, field: "ip" })).toBe("1.2.3.4");
	});

	it.each([
		["a missing field", {}],
		["a number", { ip: 42 }],
		["a nested object", { ip: { v4: "1.2.3.4" } }],
		["null", null],
		["a bare string", "1.2.3.4"],
		["an array", ["1.2.3.4"]],
	])("answers undefined for %s rather than throwing", (_label, body) => {
		expect(stringField({ body, field: "ip" })).toBeUndefined();
	});
});
