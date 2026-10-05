import { describe, expect, it } from "vitest";
import { migrateHolidays } from "./holidaysMigration";

const DAY = "2026-07-15T00:00:00.000Z";

describe("migrateHolidays", () => {
	it("moves the days kept by hand to the key the store reads now", () => {
		expect(
			migrateHolidays({ persisted: { manuallySelectedDays: [DAY], removedSuggestedDays: [] }, version: 1 }),
		).toMatchObject({
			manualDays: [DAY],
			removedSuggestedDays: [],
		});
	});

	it("leaves nothing under the old key", () => {
		expect(migrateHolidays({ persisted: { manuallySelectedDays: [DAY] }, version: 1 })).not.toHaveProperty(
			"manuallySelectedDays",
		);
	});

	it("renames the metric inside the plan, the alternatives and the applied selection, and nowhere else", () => {
		const plan = (firstLastBreak: unknown) => ({ days: [DAY], metrics: { restBlocks: 2, firstLastBreak } });
		const migrated = migrateHolidays({
			persisted: {
				suggestion: plan("a"),
				alternatives: [plan("b"), plan("c")],
				currentSelection: plan("d"),
				maxAlternatives: 4,
			},
			version: 1,
		});

		expect(migrated).toEqual({
			suggestion: { days: [DAY], metrics: { restBlocks: 2, firstLastRestBlock: "a" } },
			alternatives: [
				{ days: [DAY], metrics: { restBlocks: 2, firstLastRestBlock: "b" } },
				{ days: [DAY], metrics: { restBlocks: 2, firstLastRestBlock: "c" } },
			],
			currentSelection: { days: [DAY], metrics: { restBlocks: 2, firstLastRestBlock: "d" } },
			maxAlternatives: 4,
		});
	});

	it("adds no key the blob did not carry, so an absent one keeps the default the store starts from", () => {
		const migrated = migrateHolidays({ persisted: { maxAlternatives: 4 }, version: 1 });

		expect(Object.keys(migrated as object)).toEqual(["maxAlternatives"]);
	});

	it("keeps a plan that is absent, a plan with no metrics and a list that is not one as they came", () => {
		const migrated = migrateHolidays({
			persisted: { suggestion: null, alternatives: "none", currentSelection: { days: [] } },
			version: 1,
		});

		expect(migrated).toMatchObject({ suggestion: null, alternatives: "none", currentSelection: { days: [] } });
	});

	it("drops a blob from before the store had a version, whose shape no step was written for", () => {
		expect(migrateHolidays({ persisted: { manuallySelectedDays: [DAY], suggestion: {} }, version: 0 })).toEqual({});
	});

	it("hands back a current blob untouched", () => {
		const current = { manualDays: [DAY], suggestion: { metrics: { firstLastBreak: "kept" } } };

		expect(migrateHolidays({ persisted: current, version: 2 })).toBe(current);
	});

	it.each([null, undefined, "blob", 7, [DAY]])("hands back %j, which is no record, as it came", (value) => {
		expect(migrateHolidays({ persisted: value, version: 1 })).toBe(value);
	});
});
