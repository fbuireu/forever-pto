import { HolidayVariant } from "@application/dto/holiday/types";
import { DayRefusal, type HolidayOutcome, HolidayRefusal } from "@application/stores/types";
import { describe, expect, it } from "vitest";
import { DAY_REFUSAL_COPY, describeHolidayRefusal } from "./refusals";

const FORMATTED_DATE = "25 December 2026";

const t = ((key: string, values?: Record<string, string>) =>
	values ? `${key}:${Object.values(values).join("|")}` : key) as unknown as Parameters<
	typeof describeHolidayRefusal
>[0]["t"];

const refusal = (reason: HolidayRefusal, heldBy?: { name: string }): Extract<HolidayOutcome, { applied: false }> => ({
	applied: false,
	reason,
	heldBy: heldBy && {
		id: "held",
		date: new Date("2026-12-25T00:00:00"),
		name: heldBy.name,
		variant: HolidayVariant.NATIONAL,
		isInPlanningWindow: true,
	},
});

describe("DAY_REFUSAL_COPY", () => {
	it("carries a title and a description for every refusal a reader can hit", () => {
		for (const reason of [
			DayRefusal.DAY_IS_HOLIDAY,
			DayRefusal.DAY_IS_CUSTOM_HOLIDAY,
			DayRefusal.DAY_IS_WEEKEND,
			DayRefusal.BUDGET_EXHAUSTED,
		]) {
			expect(DAY_REFUSAL_COPY[reason]).toMatchObject({ title: expect.any(String), description: expect.any(String) });
		}
	});

	it("has no copy for a refusal that only means the plan is not there yet", () => {
		expect(DAY_REFUSAL_COPY[DayRefusal.NO_PLAN]).toBeNull();
	});

	it("names every refusal the stores can answer with", () => {
		expect(Object.keys(DAY_REFUSAL_COPY).toSorted()).toEqual(Object.values(DayRefusal).toSorted());
	});
});

describe("describeHolidayRefusal", () => {
	it("names the Holiday already holding the date", () => {
		expect(
			describeHolidayRefusal({
				outcome: refusal(HolidayRefusal.DATE_HELD_BY_HOLIDAY, { name: "Christmas" }),
				t,
				formattedDate: FORMATTED_DATE,
			}),
		).toEqual({
			title: "existsTitle",
			description: `existsDescription:${FORMATTED_DATE}|Christmas`,
		});
	});

	it("names no Holiday when the refusal carries none", () => {
		expect(
			describeHolidayRefusal({
				outcome: refusal(HolidayRefusal.DATE_HELD_BY_HOLIDAY),
				t,
				formattedDate: FORMATTED_DATE,
			})?.description,
		).toBe(`existsDescription:${FORMATTED_DATE}|`);
	});

	it("describes a date held by a hand-picked day", () => {
		expect(
			describeHolidayRefusal({
				outcome: refusal(HolidayRefusal.DATE_HELD_BY_MANUAL_DAY),
				t,
				formattedDate: FORMATTED_DATE,
			}),
		).toEqual({
			title: "manualDayExistsTitle",
			description: `manualDayExistsDescription:${FORMATTED_DATE}`,
		});
	});

	it("leaves the one refusal with no copy of its own to the modals", () => {
		expect(
			describeHolidayRefusal({
				outcome: refusal(HolidayRefusal.HOLIDAY_NOT_FOUND),
				t,
				formattedDate: FORMATTED_DATE,
			}),
		).toBeNull();
	});
});
