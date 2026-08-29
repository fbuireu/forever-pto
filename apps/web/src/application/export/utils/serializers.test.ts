import { describe, expect, it } from "vitest";
import { toIcsDate, toIcsTimestamp } from "./serializers";

describe("toIcsDate", () => {
	it("formats a date as YYYYMMDD", () => {
		expect(toIcsDate(new Date(2025, 0, 1))).toBe("20250101");
	});

	it("pads month and day with leading zeros", () => {
		expect(toIcsDate(new Date(2025, 2, 5))).toBe("20250305");
	});

	it("handles end-of-year date", () => {
		expect(toIcsDate(new Date(2025, 11, 31))).toBe("20251231");
	});
});

describe("toIcsTimestamp", () => {
	it("formats an instant as a UTC stamp with no separators", () => {
		expect(toIcsTimestamp(new Date("2025-03-09T14:30:05.123Z"))).toBe("20250309T143005Z");
	});
});
