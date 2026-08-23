import type { RawHoliday } from "@application/dto/holiday/types";
import { describe, expect, it } from "vitest";
import { keepNonWorking, stampRegion } from "./nonWorking";

const raw = (name: string, type: RawHoliday["type"]): RawHoliday =>
	({ date: "2025-01-01 00:00:00", start: new Date(), end: new Date(), name, type }) as RawHoliday;

describe("keepNonWorking", () => {
	it("keeps public and bank days", () => {
		const kept = keepNonWorking([raw("New Year", "public"), raw("Boxing Day", "bank")]);
		expect(kept.map(({ name }) => name)).toEqual(["New Year", "Boxing Day"]);
	});

	it("drops the three types the planner treats as working days", () => {
		const kept = keepNonWorking([
			raw("Term ends", "school"),
			raw("Half day", "optional"),
			raw("Name day", "observance"),
		]);
		expect(kept).toEqual([]);
	});

	it("keeps the non-working ones out of a mixed list", () => {
		const kept = keepNonWorking([raw("Easter", "public"), raw("Name day", "observance"), raw("Bank", "bank")]);
		expect(kept.map(({ name }) => name)).toEqual(["Easter", "Bank"]);
	});
});

describe("stampRegion", () => {
	it("marks every entry with the region it came from", () => {
		const stamped = stampRegion({ raw: [raw("Sant Jordi", "public"), raw("Sant Joan", "public")], region: "CT" });
		expect(stamped.every(({ location }) => location === "CT")).toBe(true);
	});

	it("leaves the original entries untouched", () => {
		const original = raw("Sant Jordi", "public");
		stampRegion({ raw: [original], region: "CT" });
		expect(original.location).toBeUndefined();
	});

	it("returns an empty list unchanged", () => {
		expect(stampRegion({ raw: [], region: "CT" })).toEqual([]);
	});
});
