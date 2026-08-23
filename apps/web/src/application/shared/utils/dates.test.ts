import { EN } from "@infrastructure/i18n/locales";
import { describe, expect, it, vi } from "vitest";
import {
	addDays,
	addMonths,
	differenceInDays,
	eachDayOfInterval,
	endOfMonth,
	formatDate,
	getWeekdayNames,
	isBefore,
	isSameDay,
	isSameMonth,
	isWeekend,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "./dates";

describe("isSameDay", () => {
	it("returns true for the same date", () => {
		expect(isSameDay(new Date(2024, 0, 1), new Date(2024, 0, 1))).toBe(true);
	});

	it("returns false for different dates", () => {
		expect(isSameDay(new Date(2024, 0, 1), new Date(2024, 0, 2))).toBe(false);
	});
});

describe("isSameMonth", () => {
	it("returns true for dates in the same month", () => {
		expect(isSameMonth(new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(true);
	});

	it("returns false for different months", () => {
		expect(isSameMonth(new Date(2024, 0, 1), new Date(2024, 1, 1))).toBe(false);
	});
});

describe("isWeekend", () => {
	it("returns true for Saturday", () => {
		expect(isWeekend(new Date(2024, 0, 6))).toBe(true);
	});

	it("returns true for Sunday", () => {
		expect(isWeekend(new Date(2024, 0, 7))).toBe(true);
	});

	it("returns false for Monday", () => {
		expect(isWeekend(new Date(2024, 0, 8))).toBe(false);
	});
});

describe("addDays", () => {
	it("adds days correctly", () => {
		const result = addDays(new Date(2024, 0, 1), 5);
		expect(result.getDate()).toBe(6);
	});

	it("handles month boundaries", () => {
		const result = addDays(new Date(2024, 0, 31), 1);
		expect(result.getMonth()).toBe(1);
		expect(result.getDate()).toBe(1);
	});
});

describe("addMonths", () => {
	it("adds months correctly", () => {
		const result = addMonths(new Date(2024, 0, 15), 2);
		expect(result.getMonth()).toBe(2);
		expect(result.getDate()).toBe(15);
	});

	it("constrains to last day when target month is shorter", () => {
		const result = addMonths(new Date(2024, 0, 31), 1);
		expect(result.getMonth()).toBe(1);
		expect(result.getDate()).toBe(29);
	});
});

describe("differenceInDays", () => {
	it("returns positive when left is after right", () => {
		const left = new Date(2024, 0, 10);
		const right = new Date(2024, 0, 5);
		expect(differenceInDays(left, right)).toBe(5);
	});
});

describe("startOfDay", () => {
	it("sets time to midnight", () => {
		const d = startOfDay(new Date(2024, 0, 15, 14, 30, 45));
		expect(d.getHours()).toBe(0);
		expect(d.getMinutes()).toBe(0);
		expect(d.getSeconds()).toBe(0);
	});
});

describe("startOfMonth / endOfMonth", () => {
	it("startOfMonth returns the 1st", () => {
		expect(startOfMonth(new Date(2024, 5, 20)).getDate()).toBe(1);
	});

	it("endOfMonth returns the last day", () => {
		expect(endOfMonth(new Date(2024, 1, 5)).getDate()).toBe(29);
	});
});

describe("startOfWeek", () => {
	it("defaults to Sunday as week start", () => {
		const d = startOfWeek(new Date(2024, 0, 10));
		expect(d.getDay()).toBe(0);
	});

	it("respects weekStartsOn option", () => {
		const d = startOfWeek(new Date(2024, 0, 10), { weekStartsOn: 1 });
		expect(d.getDay()).toBe(1);
	});
});

describe("eachDayOfInterval", () => {
	it("returns all days in interval inclusive", () => {
		const days = eachDayOfInterval({ start: new Date(2024, 0, 1), end: new Date(2024, 0, 3) });
		expect(days).toHaveLength(3);
	});
});

describe("isBefore", () => {
	it("returns true when date is earlier", () => {
		expect(isBefore(new Date(2024, 0, 1), new Date(2024, 0, 2))).toBe(true);
	});
});

const countConstructions = (run: () => void): number => {
	const Original = Intl.DateTimeFormat;
	let built = 0;
	// biome-ignore lint/complexity/useArrowFunction: an arrow is not a constructor, and formatDate calls this with new
	const spy = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (
		...args: ConstructorParameters<typeof Intl.DateTimeFormat>
	) {
		built += 1;
		return new Original(...args);
	} as unknown as typeof Intl.DateTimeFormat);

	try {
		run();
	} finally {
		spy.mockRestore();
	}

	return built;
};

describe("formatDate", () => {
	const FRIDAY = new Date(2024, 0, 5);

	it("formats as ISO date", () => {
		expect(formatDate({ date: FRIDAY, locale: EN, format: "yyyy-MM-dd" })).toBe("2024-01-05");
	});

	it("formats as ISO date and time", () => {
		expect(formatDate({ date: new Date(2024, 0, 5, 9, 7, 3), locale: EN, format: "yyyy-MM-dd HH:mm:ss" })).toBe(
			"2024-01-05 09:07:03",
		);
	});

	it.each([
		["yyyy", "2024"],
		["MMM", "Jan"],
		["MMMM", "January"],
		["d", "5"],
		["EEEE", "Friday"],
		["EE", "Fri"],
		["EEEEE", "F"],
		["MMM d, yyyy", "Jan 5, 2024"],
	] as const)("routes %s through the whitelist", (format, expected) => {
		expect(formatDate({ date: FRIDAY, locale: "en-US", format })).toBe(expected);
	});

	it("answers the same locale and format from one memoised Intl.DateTimeFormat", () => {
		formatDate({ date: FRIDAY, locale: "en-GB", format: "MMMM d, yyyy" });
		const constructions = countConstructions(() => {
			formatDate({ date: new Date(2024, 5, 9), locale: "en-GB", format: "MMMM d, yyyy" });
		});

		expect(constructions).toBe(0);
	});

	it("keys the cache on the locale, so a second locale is a miss", () => {
		formatDate({ date: FRIDAY, locale: "en-AU", format: "MMMM" });
		const constructions = countConstructions(() => {
			formatDate({ date: FRIDAY, locale: "en-AU", format: "MMMM" });
			formatDate({ date: FRIDAY, locale: "en-NZ", format: "MMMM" });
		});

		expect(constructions).toBe(1);
	});
});

describe("getWeekdayNames", () => {
	it("returns 7 names", () => {
		const names = getWeekdayNames({ locale: EN });
		expect(names).toHaveLength(7);
	});

	it("starts on Monday when weekStartsOn is 1", () => {
		const names = getWeekdayNames({ locale: "en-US", weekStartsOn: 1, format: "long" });
		expect(names[0].toLowerCase()).toContain("mon");
	});

	it.each([
		["narrow", "M"],
		["short", "Mon"],
		["long", "Monday"],
	] as const)("renders %s weekdays through formatDate's whitelist", (format, expected) => {
		expect(getWeekdayNames({ locale: "en-US", weekStartsOn: 1, format })[0]).toBe(expected);
	});

	it("shares formatDate's cache instead of keeping one of its own", () => {
		getWeekdayNames({ locale: "en-IE", weekStartsOn: 1, format: "long" });
		const constructions = countConstructions(() => {
			getWeekdayNames({ locale: "en-IE", weekStartsOn: 1, format: "long" });
			formatDate({ date: new Date(2024, 0, 5), locale: "en-IE", format: "EEEE" });
		});

		expect(constructions).toBe(0);
	});
});
