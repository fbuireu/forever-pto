import { afterEach, describe, expect, it, vi } from "vitest";
import { HOLIDAYS_STORAGE_NAME, hasStoredPlan } from "./storedPlan";

afterEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
});

describe("hasStoredPlan", () => {
	it("answers false on a first visit", () => {
		expect(hasStoredPlan()).toBe(false);
	});

	it("answers true once the holidays store has written its blob", () => {
		localStorage.setItem(HOLIDAYS_STORAGE_NAME, "anything");

		expect(hasStoredPlan()).toBe(true);
	});

	it("answers false when storage refuses to be read", () => {
		const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("denied");
		});

		try {
			expect(hasStoredPlan()).toBe(false);
		} finally {
			getItem.mockRestore();
		}
	});
});
