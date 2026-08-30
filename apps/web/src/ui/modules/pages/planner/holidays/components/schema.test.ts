import { describe, expect, it } from "vitest";
import { createHolidaySchema } from "./schema";

const MESSAGES = {
	nameRequired: "Name it",
	nameMax: "Too long",
	invalidDate: "Not a date",
};

const schema = createHolidaySchema(MESSAGES);

const firstMessage = (value: unknown) => {
	const result = schema.safeParse(value);

	return result.success ? null : result.error.issues[0]?.message;
};

const A_DATE = new Date("2026-12-25T00:00:00");

describe("createHolidaySchema", () => {
	it("accepts a named Custom Holiday on a date", () => {
		expect(schema.safeParse({ name: "Office closure", date: A_DATE }).success).toBe(true);
	});

	it("refuses an empty name with the message it was given", () => {
		expect(firstMessage({ name: "", date: A_DATE })).toBe(MESSAGES.nameRequired);
	});

	it("refuses a name past a hundred characters", () => {
		expect(firstMessage({ name: "a".repeat(101), date: A_DATE })).toBe(MESSAGES.nameMax);
	});

	it("accepts a name of exactly a hundred characters", () => {
		expect(schema.safeParse({ name: "a".repeat(100), date: A_DATE }).success).toBe(true);
	});

	it("refuses anything that is not a date", () => {
		expect(firstMessage({ name: "Office closure", date: "2026-12-25" })).toBe(MESSAGES.invalidDate);
	});

	it("refuses a missing date", () => {
		expect(firstMessage({ name: "Office closure" })).toBe(MESSAGES.invalidDate);
	});
});
