import type { HolidayDTO } from "@application/dto/holiday/types";
import type { Locale } from "next-intl";
import type { Suggestion } from "../types";
import { resolveSelectedDays } from "../utils/selection";
import type { PlanningWindow } from "../window";
import {
	calculateLongestVacation,
	calculateLongWeekends,
	calculateMaxWorkStreak,
	calculateQuarterDistribution,
	calculateRestBlocks,
	getFirstLastBreak,
	getLongBlocksPerQuarter,
	getMonthlyDist,
	getTotalEffectiveDays,
	getValidBridges,
	getWorkedDaysPerMonth,
} from "./utils/helpers";
import { freeStreaks } from "./utils/streaks";

interface GenerateMetricsParams {
	suggestion: Omit<Suggestion, "metrics">;
	locale: Locale;
	planningWindow: PlanningWindow;
	holidays: HolidayDTO[];
	allowPastDays: boolean;
	manuallySelectedDays: Date[];
	removedSuggestedDays: Date[];
}

export const generateMetrics = ({
	suggestion,
	locale,
	planningWindow,
	holidays,
	allowPastDays,
	manuallySelectedDays,
	removedSuggestedDays,
}: GenerateMetricsParams) => {
	const { bridges } = suggestion;
	const { year } = planningWindow;
	const days = resolveSelectedDays({ days: suggestion.days, manuallySelectedDays, removedSuggestedDays });

	const monthlyDist = getMonthlyDist({ days, window: planningWindow });
	const streaks = freeStreaks({ placedDays: days, holidays });
	const longBlocksPerQuarter = getLongBlocksPerQuarter({ streaks, window: planningWindow });
	const totalEffectiveDays = getTotalEffectiveDays({ days, bridges, holidays });
	const bridgesUsed = getValidBridges({ days, bridges }).length;
	const longWeekends = calculateLongWeekends(streaks);
	const longestVacation = calculateLongestVacation(streaks);

	const restBlocks = calculateRestBlocks(days);
	const maxWorkStreak = calculateMaxWorkStreak({
		ptoDays: days,
		holidays,
		allowPastDays,
		year,
	});
	const firstLastBreak = getFirstLastBreak({ dates: days, locale });
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
		firstLastBreak,
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
