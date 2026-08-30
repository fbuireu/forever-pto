import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentYear } from "./getCurrentYear";

afterEach(() => {
	vi.useRealTimers();
});

describe("getCurrentYear", () => {
	it("answers the year the clock is in", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2031-03-04T10:00:00Z"));

		await expect(getCurrentYear()).resolves.toBe(2031);
	});

	it("answers the year of the last moment of a year, not the next one", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59));

		await expect(getCurrentYear()).resolves.toBe(2026);
	});
});
