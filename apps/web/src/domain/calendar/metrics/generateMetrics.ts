import type { HolidayDTO } from "@application/dto/holiday/types";
import type { Suggestion } from "@domain/calendar/types";
import { resolveSelectedDays } from "@domain/calendar/utils/selection";
import type { PlanningWindow } from "@domain/calendar/window";
import type { Locale } from "next-intl";
import {
	calculateLongestVacation,
	calculateLongWeekends,
	calculateMaxWorkStreak,
	calculateQuarterDistribution,
	calculateRestBlocks,
	getBridgesInUse,
	getFirstLastRestBlock,
	getLongBlocksPerQuarter,
	getMonthlyDist,
	getTotalEffectiveDays,
	getWorkedDaysPerMonth,
} from "./utils/helpers";
import { freeStreaks } from "./utils/streaks";

interface GenerateMetricsParams {
	suggestion: Omit<Suggestion, "metrics">;
	locale: Locale;
	planningWindow: PlanningWindow;
	holidays: HolidayDTO[];
	allowPastDays: boolean;
	manualDays: Date[];
	removedSuggestedDays: Date[];
}

export const generateMetrics = ({
	suggestion,
	locale,
	planningWindow,
	holidays,
	allowPastDays,
	manualDays,
	removedSuggestedDays,
}: GenerateMetricsParams) => {
	const { bridges } = suggestion;
	const { year } = planningWindow;
	const days = resolveSelectedDays({ days: suggestion.days, manualDays, removedSuggestedDays });

	const monthlyDist = getMonthlyDist({ days, window: planningWindow });
	const streaks = freeStreaks({ placedDays: days, holidays });
	const longBlocksPerQuarter = getLongBlocksPerQuarter({ streaks, window: planningWindow });
	const totalEffectiveDays = getTotalEffectiveDays(streaks);
	const bridgesUsed = getBridgesInUse({ days, bridges }).length;
	const longWeekends = calculateLongWeekends(streaks);
	const longestVacation = calculateLongestVacation(streaks);

	const restBlocks = calculateRestBlocks(days);
	const maxWorkStreak = calculateMaxWorkStreak({
		ptoDays: days,
		holidays,
		allowPastDays,
		year,
	});
	const firstLastRestBlock = getFirstLastRestBlock({ dates: days, locale });
	const quarterDist = calculateQuarterDistribution({ dates: days, window: planningWindow });
	const workedDaysPerMonth = getWorkedDaysPerMonth({
		ptoDays: days,
		holidays,
		year,
	});
	const efficiency = days.length > 0 ? totalEffectiveDays / days.length : 0;

	const bonusDays = totalEffectiveDays - days.length;

	return {
		longWeekends,
		restBlocks,
		maxWorkStreak,
		firstLastRestBlock,
		averageEfficiency: efficiency,
		bonusDays,
		quarterDist,
		bridgesUsed,
		workedDaysPerMonth,
		totalEffectiveDays,
		monthlyDist,
		longBlocksPerQuarter,
		longestVacation,
	};
};
