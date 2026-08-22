import { DayRefusal, type HolidayOutcome, HolidayRefusal } from "@application/stores/types";
import type { useTranslations } from "next-intl";

export const DAY_REFUSAL_COPY = {
	[DayRefusal.NO_PLAN]: null,
	[DayRefusal.DAY_IS_HOLIDAY]: { title: "cannotSelectHoliday", description: "cannotSelectHolidayDescription" },
	[DayRefusal.DAY_IS_CUSTOM_HOLIDAY]: {
		title: "cannotSelectFreeDay",
		description: "cannotSelectCustomHolidayDescription",
	},
	[DayRefusal.DAY_IS_WEEKEND]: { title: "cannotSelectFreeDay", description: "cannotSelectWeekendDescription" },
	[DayRefusal.BUDGET_EXHAUSTED]: { title: "noPtoDaysRemaining", description: "removeDaysToFree" },
} as const;

type HolidayRefusalTranslator = ReturnType<typeof useTranslations<"modals.addHoliday">>;

interface DescribeHolidayRefusalParams {
	outcome: Extract<HolidayOutcome, { applied: false }>;
	t: HolidayRefusalTranslator;
	formattedDate: string;
}

export const describeHolidayRefusal = ({
	outcome,
	t,
	formattedDate,
}: DescribeHolidayRefusalParams): { title: string; description: string } | null => {
	switch (outcome.reason) {
		case HolidayRefusal.DATE_HELD_BY_HOLIDAY:
			return {
				title: t("existsTitle"),
				description: t("existsDescription", { date: formattedDate, name: outcome.heldBy?.name ?? "" }),
			};
		case HolidayRefusal.DATE_HELD_BY_MANUAL_DAY:
			return {
				title: t("manualDayExistsTitle"),
				description: t("manualDayExistsDescription", { date: formattedDate }),
			};
		case HolidayRefusal.HOLIDAY_NOT_FOUND:
			return null;
	}
};
