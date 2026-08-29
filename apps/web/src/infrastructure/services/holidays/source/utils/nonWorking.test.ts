import type { RawHoliday } from "@application/dto/holiday/types";
import { describe, expect, it } from "vitest";
import { keepNonWorking, stampRegion } from "./nonWorking";

interface RawParams {
	name: string;
	type: RawHoliday["type"];
}

const raw = ({ name, type }: RawParams): RawHoliday =>
	({ date: "2025-01-01 00:00:00", start: new Date(), end: new Date(), name, type }) as RawHoliday;

describe("keepNonWorking", () => {
	it("keeps public and bank days", () => {
		const kept = keepNonWorking([raw({ name: "New Year", type: "public" }), raw({ name: "Boxing Day", type: "bank" })]);
		expect(kept.map(({ name }) => name)).toEqual(["New Year", "Boxing Day"]);
	});

	it("drops the three types the planner treats as working days", () => {
		const kept = keepNonWorking([
			raw({ name: "Term ends", type: "school" }),
			raw({ name: "Half day", type: "optional" }),
			raw({ name: "Name day", type: "observance" }),
		]);
		expect(kept).toEqual([]);
	});

	it("keeps the non-working ones out of a mixed list", () => {
		const kept = keepNonWorking([
			raw({ name: "Easter", type: "public" }),
			raw({ name: "Name day", type: "observance" }),
			raw({ name: "Bank", type: "bank" }),
		]);
		expect(kept.map(({ name }) => name)).toEqual(["Easter", "Bank"]);
	});
});

describe("stampRegion", () => {
	it("marks every entry with the region it came from", () => {
		const stamped = stampRegion({
			raw: [raw({ name: "Sant Jordi", type: "public" }), raw({ name: "Sant Joan", type: "public" })],
			region: "CT",
		});
		expect(stamped.every(({ location }) => location === "CT")).toBe(true);
	});

	it("leaves the original entries untouched", () => {
		const original = raw({ name: "Sant Jordi", type: "public" });
		stampRegion({ raw: [original], region: "CT" });
		expect(original.location).toBeUndefined();
	});

	it("returns an empty list unchanged", () => {
		expect(stampRegion({ raw: [], region: "CT" })).toEqual([]);
	});
});
