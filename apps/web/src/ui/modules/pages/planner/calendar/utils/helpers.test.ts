import { describe, expect, it } from "vitest";
import { isPast } from "../../utils/modifiers";
import { getDayClassNames, MODIFIERS_CLASS_NAMES } from "./helpers";

const MONTH = new Date(2025, 0, 1);
const DAY = new Date(2025, 0, 15);

const always = (): boolean => true;
const never = (): boolean => false;

const classesFor = (overrides: Partial<Parameters<typeof getDayClassNames>[0]> = {}): string =>
	getDayClassNames({
		date: DAY,
		month: MONTH,
		isSelected: false,
		disabled: false,
		modifiers: {},
		...overrides,
	});

interface HasParams {
	classes: string;
	name: keyof typeof MODIFIERS_CLASS_NAMES;
}

const has = ({ classes, name }: HasParams): boolean => classes.includes(MODIFIERS_CLASS_NAMES[name]);

describe("getDayClassNames precedence", () => {
	it("paints a Holiday when nothing outranks it", () => {
		const classes = classesFor({ modifiers: { holiday: always } });
		expect(has({ classes, name: "holiday" })).toBe(true);
	});

	it("lets today suppress every other modifier, Holiday included", () => {
		const classes = classesFor({ modifiers: { today: always, holiday: always, suggested: always } });
		expect(has({ classes, name: "today" })).toBe(true);
		expect(has({ classes, name: "holiday" })).toBe(false);
		expect(has({ classes, name: "suggested" })).toBe(false);
	});

	it("lets a selected day suppress the modifiers and win outright", () => {
		const classes = classesFor({
			isSelected: true,
			modifiers: { holiday: always, suggested: always, manual: always },
		});
		expect(has({ classes, name: "selected" })).toBe(true);
		expect(has({ classes, name: "holiday" })).toBe(false);
		expect(has({ classes, name: "suggested" })).toBe(false);
		expect(has({ classes, name: "manual" })).toBe(false);
	});

	it("stacks the non-range modifiers that match, since none of them outranks another", () => {
		const classes = classesFor({ modifiers: { weekend: always, holiday: always } });
		expect(has({ classes, name: "weekend" })).toBe(true);
		expect(has({ classes, name: "holiday" })).toBe(true);
	});

	it("lets a selected day suppress inRange but not rangeStart, which are applied by separate guards", () => {
		const unselected = classesFor({ modifiers: { inRange: always, rangeStart: always } });
		expect(has({ classes: unselected, name: "inRange" })).toBe(true);
		expect(has({ classes: unselected, name: "rangeStart" })).toBe(true);

		const selected = classesFor({ isSelected: true, modifiers: { inRange: always, rangeStart: always } });
		expect(has({ classes: selected, name: "inRange" })).toBe(false);
		expect(has({ classes: selected, name: "rangeStart" })).toBe(true);
	});

	it("applies no range class when no range modifier matches", () => {
		const classes = classesFor({ modifiers: { inRange: never, rangeStart: never, rangeEnd: never } });
		expect(has({ classes, name: "inRange" })).toBe(false);
		expect(has({ classes, name: "rangeStart" })).toBe(false);
	});

	it("drops every state class when the day is disabled", () => {
		const classes = classesFor({
			disabled: true,
			isSelected: true,
			modifiers: { today: always, holiday: always, inRange: always },
		});
		expect(has({ classes, name: "today" })).toBe(false);
		expect(has({ classes, name: "holiday" })).toBe(false);
		expect(has({ classes, name: "selected" })).toBe(false);
		expect(has({ classes, name: "inRange" })).toBe(false);
		expect(classes).toContain("cursor-not-allowed");
	});
});

describe("getDayClassNames month and past-day handling", () => {
	it("sets a day outside the month back in the muted ink at the regular weight, never by fading it", () => {
		const classes = classesFor({ date: new Date(2025, 1, 3) }).split(" ");

		expect(classes).toEqual(expect.arrayContaining(["text-muted-foreground", "font-normal"]));
		expect(classes.filter((name) => name.includes("opacity"))).toEqual([]);
	});

	it("keeps the fill's own ink on a filled day outside the month, so only its weight changes", () => {
		const classes = classesFor({ date: new Date(2025, 1, 3), modifiers: { suggested: always } }).split(" ");

		expect(classes).toContain("font-normal");
		expect(classes).not.toContain("text-muted-foreground");
	});

	it("strikes a past day through the same predicate the click handler binds, not a second copy of the rule", () => {
		const today = new Date(2025, 0, 20);

		expect(classesFor({ modifiers: { disabled: isPast({ allowPastDays: false, today }) } })).toContain("line-through");
		expect(classesFor({ modifiers: { disabled: isPast({ allowPastDays: true, today }) } })).not.toContain(
			"line-through",
		);
		expect(classesFor({ modifiers: { disabled: isPast({ allowPastDays: false, today: null }) } })).not.toContain(
			"line-through",
		);
	});

	it("strikes a disabled past day in the muted ink, and overrides the button's own fade", () => {
		const today = new Date(2025, 0, 20);
		const classes = classesFor({
			disabled: true,
			modifiers: { disabled: isPast({ allowPastDays: false, today }) },
		}).split(" ");

		expect(classes).toEqual(expect.arrayContaining(["line-through", "text-muted-foreground", "disabled:opacity-100"]));
		expect(classes.filter((name) => name.includes("opacity") && name !== "disabled:opacity-100")).toEqual([]);
	});

	it("leaves a future day unmarked even while the past is excluded", () => {
		const today = new Date(2025, 0, 1);

		expect(classesFor({ modifiers: { disabled: isPast({ allowPastDays: false, today }) } })).not.toContain(
			"line-through",
		);
	});

	it("offers the hover lift only to a day that carries no state of its own", () => {
		expect(classesFor()).toContain("hit-area-stable");
		expect(classesFor({ isSelected: true })).not.toContain("hit-area-stable");
		expect(classesFor({ modifiers: { today: always } })).not.toContain("hit-area-stable");
	});
});

describe("the text of a day on a brand fill", () => {
	const BRAND_FILLED = ["suggested", "alternative", "manual"] as const;
	const HOLIDAY_FILLED = ["holiday", "custom"] as const;
	const INK = "text-[var(--color-brand-ink)]";
	const HOLIDAY_INK = "text-day-holiday-ink";
	const TEXT_COLOUR = /(?<![\w-])text-(?:\[var\(--[\w-]+\)\]|day-[\w-]+)/g;

	it.each(BRAND_FILLED)(
		"reads a %s day in the ink token, which both themes keep, whatever colour the page inherits",
		(name) => {
			expect(MODIFIERS_CLASS_NAMES[name].match(TEXT_COLOUR)).toEqual([INK]);
		},
	);

	it.each(HOLIDAY_FILLED)("reads a %s day in the holiday ink, which flips with the holiday fill", (name) => {
		expect(MODIFIERS_CLASS_NAMES[name].match(TEXT_COLOUR)).toEqual([HOLIDAY_INK]);
	});

	it("gives every brand-filled day the same ink, so a Manual Day reads like a Suggested one", () => {
		const inks = BRAND_FILLED.map((name) => MODIFIERS_CLASS_NAMES[name].match(TEXT_COLOUR)?.[0]);

		expect(new Set(inks).size).toBe(1);
		expect(inks).toHaveLength(BRAND_FILLED.length);
	});
});
