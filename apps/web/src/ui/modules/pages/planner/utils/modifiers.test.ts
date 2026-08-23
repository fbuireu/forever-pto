import type { HolidayDTO } from "@application/dto/holiday/types";
import { HolidayVariant } from "@application/dto/holiday/types";
import type { MeasuredSuggestion, Suggestion } from "@domain/calendar/types";
import { describe, expect, it } from "vitest";
import {
	getPreviewRange,
	isAlternative,
	isCustom,
	isHoliday,
	isInRange,
	isManuallySelected,
	isNationalOrRegionalHoliday,
	isPast,
	isRangeEnd,
	isRangeSelected,
	isRangeStart,
	isSelected,
	isSuggestion,
	isToday,
} from "./modifiers";

const day = (d: number) => new Date(2026, 5, d);

const MONDAY = day(1);
const TUESDAY = day(2);
const WEDNESDAY = day(3);
const THURSDAY = day(4);

const suggestionOf = (days: Date[]) => ({ days }) as unknown as Suggestion;
const measuredOf = (days: Date[]) => ({ days }) as unknown as MeasuredSuggestion;

const holidayOf = (date: Date, variant: HolidayDTO["variant"]) => ({ date, variant, name: "A day" }) as HolidayDTO;

describe("isPast", () => {
	it("refuses to call anything past while past days are allowed", () => {
		expect(isPast({ allowPastDays: true, today: day(10) })(MONDAY)).toBe(false);
	});

	it("refuses to call anything past before the client knows what today is", () => {
		expect(isPast({ allowPastDays: false, today: null })(MONDAY)).toBe(false);
	});

	it("counts a day before today as past, and today itself as not", () => {
		const isPastDay = isPast({ allowPastDays: false, today: WEDNESDAY });

		expect(isPastDay(TUESDAY)).toBe(true);
		expect(isPastDay(WEDNESDAY)).toBe(false);
		expect(isPastDay(THURSDAY)).toBe(false);
	});
});

describe("isToday", () => {
	it("matches only the day the client set, and nothing at all before it is set", () => {
		expect(isToday(WEDNESDAY)(WEDNESDAY)).toBe(true);
		expect(isToday(WEDNESDAY)(THURSDAY)).toBe(false);
		expect(isToday(null)(WEDNESDAY)).toBe(false);
	});
});

describe("isSuggestion", () => {
	it("paints a day the plan placed", () => {
		expect(isSuggestion(suggestionOf([MONDAY, TUESDAY]))(MONDAY)).toBe(true);
	});

	it("stops painting a Suggested Day the user took back", () => {
		const isSuggested = isSuggestion(suggestionOf([MONDAY, TUESDAY]), [MONDAY]);

		expect(isSuggested(MONDAY)).toBe(false);
		expect(isSuggested(TUESDAY)).toBe(true);
	});

	it("paints nothing while there is no plan", () => {
		expect(isSuggestion(null)(MONDAY)).toBe(false);
	});
});

describe("isManuallySelected", () => {
	it("matches by day, not by instant", () => {
		const sameDayLaterHour = new Date(2026, 5, 1, 18, 30);

		expect(isManuallySelected([MONDAY])(sameDayLaterHour)).toBe(true);
		expect(isManuallySelected([MONDAY])(TUESDAY)).toBe(false);
	});
});

describe("isAlternative", () => {
	const suggestion = measuredOf([MONDAY, TUESDAY]);
	const alternatives = [measuredOf([WEDNESDAY]), measuredOf([THURSDAY])];

	it("reads index 0 as the Suggestion itself, not as the first Alternative", () => {
		const paints = isAlternative({ alternatives, suggestion, previewAlternativeIndex: 0, currentSelection: null });

		expect(paints(MONDAY)).toBe(true);
		expect(paints(WEDNESDAY)).toBe(false);
	});

	it("reads index n as alternatives[n - 1]", () => {
		const first = isAlternative({ alternatives, suggestion, previewAlternativeIndex: 1, currentSelection: null });
		const second = isAlternative({ alternatives, suggestion, previewAlternativeIndex: 2, currentSelection: null });

		expect(first(WEDNESDAY)).toBe(true);
		expect(first(THURSDAY)).toBe(false);
		expect(second(THURSDAY)).toBe(true);
	});

	it("paints nothing at the default sentinel, which lands two before the first Alternative", () => {
		const paints = isAlternative({ alternatives, suggestion, previewAlternativeIndex: -1, currentSelection: null });

		expect(paints(MONDAY)).toBe(false);
		expect(paints(WEDNESDAY)).toBe(false);
		expect(paints(THURSDAY)).toBe(false);
	});

	it("suppresses a date the applied Suggestion already holds, so only the difference is painted", () => {
		const overlapping = [measuredOf([TUESDAY, WEDNESDAY])];
		const paints = isAlternative({
			alternatives: overlapping,
			suggestion,
			previewAlternativeIndex: 1,
			currentSelection: suggestionOf([TUESDAY]),
		});

		expect(paints(TUESDAY)).toBe(false);
		expect(paints(WEDNESDAY)).toBe(true);
	});
});

describe("the Holiday predicates", () => {
	const holidays = [holidayOf(MONDAY, HolidayVariant.NATIONAL), holidayOf(TUESDAY, HolidayVariant.CUSTOM)];

	it("isHoliday matches any Variant", () => {
		expect(isHoliday(holidays)(MONDAY)).toBe(true);
		expect(isHoliday(holidays)(TUESDAY)).toBe(true);
		expect(isHoliday(holidays)(WEDNESDAY)).toBe(false);
	});

	it("isCustom matches only a Custom Holiday", () => {
		expect(isCustom(holidays)(TUESDAY)).toBe(true);
		expect(isCustom(holidays)(MONDAY)).toBe(false);
	});

	it("isNationalOrRegionalHoliday is the complement a Custom Holiday falls outside of", () => {
		expect(isNationalOrRegionalHoliday(holidays)(MONDAY)).toBe(true);
		expect(isNationalOrRegionalHoliday(holidays)(TUESDAY)).toBe(false);
	});
});

describe("the range family", () => {
	const range = { from: TUESDAY, to: THURSDAY };

	it("isInRange spans the boundaries inclusively and answers false without both ends", () => {
		expect(isInRange(range)(WEDNESDAY)).toBe(true);
		expect(isInRange(range)(MONDAY)).toBe(false);
		expect(isInRange({ from: TUESDAY })(WEDNESDAY)).toBe(false);
	});

	it("isRangeStart and isRangeEnd name the two boundaries, and isRangeSelected either of them", () => {
		expect(isRangeStart(range)(TUESDAY)).toBe(true);
		expect(isRangeEnd(range)(THURSDAY)).toBe(true);
		expect(isRangeSelected(range)(WEDNESDAY)).toBe(false);
		expect(isRangeSelected(range)(THURSDAY)).toBe(true);
	});

	it("isSelected matches by day", () => {
		expect(isSelected([TUESDAY])(TUESDAY)).toBe(true);
		expect(isSelected([TUESDAY])(WEDNESDAY)).toBe(false);
	});

	it("getPreviewRange paints from the anchor to the hovered day, in either direction", () => {
		const forwards = getPreviewRange({ range: { from: TUESDAY }, isSelectingTo: true, hoverDate: THURSDAY });
		const backwards = getPreviewRange({ range: { from: THURSDAY }, isSelectingTo: true, hoverDate: TUESDAY });

		expect(forwards(WEDNESDAY)).toBe(true);
		expect(backwards(WEDNESDAY)).toBe(true);
	});

	it("getPreviewRange paints nothing while the range is not being completed", () => {
		expect(getPreviewRange({ range: { from: TUESDAY }, isSelectingTo: false, hoverDate: THURSDAY })(WEDNESDAY)).toBe(
			false,
		);
		expect(getPreviewRange({ range: { from: TUESDAY }, isSelectingTo: true })(WEDNESDAY)).toBe(false);
	});
});
