import { isSameMonth } from "@application/shared/utils/dates";
import type { FromTo } from "../Calendar";

interface GetDayClassNamesParams {
	date: Date;
	month: Date;
	isSelected: boolean;
	disabled?: boolean;
	showOutsideDays: boolean;
	modifiers: Record<string, ((date: Date) => boolean) | undefined>;
}

export const MODIFIERS_CLASS_NAMES = {
	weekend:
		"rounded-lg text-muted-foreground bg-[var(--surface-panel-soft)] hover:bg-[var(--surface-panel-alt)] transition-colors border-[2px] border-[var(--frame)]/15 shadow-[var(--shadow-brutal-xs)]",
	holiday:
		"rounded-lg bg-[image:var(--holiday-fill)] text-[var(--color-brand-ink)] hover:brightness-105 font-black transition-[background-color,box-shadow] duration-200 border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)]",
	suggested:
		"rounded-lg bg-[var(--color-brand-teal)] hover:brightness-105 text-[var(--color-brand-ink)] font-black transition-[background-color,box-shadow] duration-200 border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)]",
	alternative:
		"rounded-lg bg-day-alternative text-[var(--color-brand-ink)] font-black animate-pulse border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] transition-[background-color,box-shadow,opacity] duration-200 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_4px,var(--stripe-alternative)_4px,var(--stripe-alternative)_8px)]",
	custom:
		"rounded-lg bg-day-custom text-[var(--color-brand-ink)] font-black border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] transition-[background-color,box-shadow,opacity] duration-200 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_4px,var(--stripe-custom)_4px,var(--stripe-custom)_8px)]",
	manuallySelected:
		"rounded-lg bg-[color-mix(in_srgb,var(--color-brand-purple)_18%,var(--color-brand-teal)_82%)] text-[var(--color-brand-paper)] font-black border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] transition-[background-color,box-shadow,opacity] duration-200 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_4px,var(--stripe-manual)_4px,var(--stripe-manual)_8px)]",
	selected:
		"rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-black border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] transition-[background-color,box-shadow] duration-200",
	today:
		"rounded-lg bg-[var(--color-brand-ink)] hover:bg-[var(--color-brand-yellow)] text-on-fill hover:text-[var(--color-brand-ink)] font-black border-[2px] border-[var(--frame)] shadow-[var(--shadow-brutal-sm)] ring-offset-1 ring-offset-background transition-[background-color,box-shadow] duration-200",
	inRange: "rounded-lg bg-primary/12",
	rangeStart:
		"rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-black",
	rangeEnd:
		"rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-black",
	previewRange: "rounded-lg bg-primary/10",
} as const satisfies Record<string, string>;

export type DayStateClass = keyof typeof MODIFIERS_CLASS_NAMES;

const RANGE_KEYS: string[] = ["inRange", "rangeStart", "rangeEnd"];

export const DAY_STATE_LABELS = [
	{ modifier: "manuallySelected", labelKey: "manual" },
	{ modifier: "suggested", labelKey: "suggested" },
	{ modifier: "alternative", labelKey: "alternatives" },
	{ modifier: "custom", labelKey: "custom" },
] as const;

export type DayStateLabelKey = (typeof DAY_STATE_LABELS)[number]["labelKey"];

interface GetDayStateLabelKeysParams {
	date: Date;
	modifiers: Record<string, ((date: Date) => boolean) | undefined>;
}

export const getDayStateLabelKeys = ({ date, modifiers }: GetDayStateLabelKeysParams): DayStateLabelKey[] =>
	DAY_STATE_LABELS.filter(({ modifier }) => modifiers[modifier]?.(date) ?? false).map(({ labelKey }) => labelKey);

export const getDayClassNames = ({
	date,
	month,
	isSelected,
	disabled = false,
	showOutsideDays,
	modifiers,
}: GetDayClassNamesParams) => {
	const classes: string[] = [];
	const isOutsideMonth = !isSameMonth({ a: date, b: month });
	const shouldShowAsPast = modifiers.disabled?.(date) ?? false;

	classes.push(
		"size-8 rounded-lg p-0 font-medium text-sm",
		"focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors",
	);

	const isTodayActive = modifiers.today?.(date);
	const isInRangeDay = modifiers.inRange?.(date);
	const isRangeStartDay = modifiers.rangeStart?.(date);
	const isRangeEndDay = modifiers.rangeEnd?.(date);

	if (!disabled && !isSelected) {
		if (isTodayActive) {
			classes.push(MODIFIERS_CLASS_NAMES.today);
		} else {
			Object.entries(modifiers).forEach(([name, modifierFn]) => {
				const className = MODIFIERS_CLASS_NAMES[name as DayStateClass];
				if (className && !RANGE_KEYS.includes(name) && modifierFn?.(date)) {
					classes.push(className);
				}
			});
		}
	}

	if (isInRangeDay && !isSelected && !disabled) {
		classes.push(MODIFIERS_CLASS_NAMES.inRange);
	}
	if (isRangeStartDay && !disabled) {
		classes.push(MODIFIERS_CLASS_NAMES.rangeStart);
	}
	if (isRangeEndDay && !disabled) {
		classes.push(MODIFIERS_CLASS_NAMES.rangeEnd);
	}

	if (isSelected && !disabled) {
		classes.push(MODIFIERS_CLASS_NAMES.selected);
	}

	if (disabled) {
		const opacity = isOutsideMonth ? "!opacity-20" : "!opacity-40";
		classes.push(opacity, "cursor-not-allowed pointer-events-none text-muted-foreground");
	} else {
		const outsideMonthClass = showOutsideDays ? "text-muted-foreground opacity-50" : "invisible";

		if (isOutsideMonth) {
			classes.push(outsideMonthClass);
		} else if (shouldShowAsPast) {
			classes.push("text-muted-foreground opacity-60");
		}

		if (!isSelected && !modifiers.today?.(date) && !isRangeStartDay && !isRangeEndDay) {
			classes.push(
				"hit-area-stable hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--shadow-brutal-xs)]",
			);
		}
	}

	return classes.join(" ");
};

export const isFromToObject = (obj: unknown): obj is FromTo => {
	return (
		obj !== null &&
		typeof obj === "object" &&
		obj !== undefined &&
		"from" in obj &&
		"to" in obj &&
		(obj as FromTo).from instanceof Date &&
		(obj as FromTo).to instanceof Date
	);
};
