import { describe, expect, it } from "vitest";
import { holidaysInPlanningWindow } from "./rules";
import { type HolidayDTO, HolidayVariant } from "./types";

interface HolidayOfParams {
	id: string;
	isInPlanningWindow: boolean;
}

const holidayOf = ({ id, isInPlanningWindow }: HolidayOfParams): HolidayDTO => ({
	id,
	name: id,
	date: new Date(2026, 0, 1),
	variant: HolidayVariant.NATIONAL,
	isInPlanningWindow,
});

describe("holidaysInPlanningWindow", () => {
	it("keeps the Holidays inside the Planning Window, in the order it was given them", () => {
		const holidays = [
			holidayOf({ id: "first", isInPlanningWindow: true }),
			holidayOf({ id: "outside", isInPlanningWindow: false }),
			holidayOf({ id: "last", isInPlanningWindow: true }),
		];

		expect(holidaysInPlanningWindow(holidays).map(({ id }) => id)).toStrictEqual(["first", "last"]);
	});

	it("answers none when every Holiday lies outside the window", () => {
		expect(holidaysInPlanningWindow([holidayOf({ id: "outside", isInPlanningWindow: false })])).toStrictEqual([]);
	});

	it("answers none for a list that has not arrived yet", () => {
		expect(holidaysInPlanningWindow(undefined)).toStrictEqual([]);
	});

	it("leaves the list it was handed as it was", () => {
		const holidays = [
			holidayOf({ id: "inside", isInPlanningWindow: true }),
			holidayOf({ id: "outside", isInPlanningWindow: false }),
		];

		holidaysInPlanningWindow(holidays);

		expect(holidays.map(({ id }) => id)).toStrictEqual(["inside", "outside"]);
	});
});
