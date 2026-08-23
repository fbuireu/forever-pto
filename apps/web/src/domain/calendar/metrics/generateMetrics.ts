import type { HolidayDTO } from "@application/dto/holiday/types";
import type { Locale } from "next-intl";
import type { Suggestion } from "../types";
import { resolveSelectedDays } from "../utils/selection";
import { type PlanningWindow, windowMonthCount, windowQuarterCount } from "../window";
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

	if (days.length === 0) {
		return {
			longWeekends: 0,
			restBlocks: 0,
			maxWorkStreak: 0,
			firstLastBreak: null,
			averageEfficiency: 0,
			bonusDays: 0,
			quarterDist: new Array(windowQuarterCount(planningWindow)).fill(0),
			bridgesUsed: 0,
			workedDaysPerMonth: 0,
			totalEffectiveDays: 0,
			monthlyDist: new Array(windowMonthCount(planningWindow)).fill(0),
			longBlocksPerQuarter: new Array(windowQuarterCount(planningWindow)).fill(0),
			longestVacation: 0,
		};
	}
	const monthlyDist = getMonthlyDist(days, planningWindow);
	const streaks = freeStreaks({ placedDays: days, holidays });
	const longBlocksPerQuarter = getLongBlocksPerQuarter({ streaks, window: planningWindow });
	const totalEffectiveDays = getTotalEffectiveDays(days, bridges, holidays);
	const bridgesUsed = getValidBridges(days, bridges).length;
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
	const quarterDist = calculateQuarterDistribution(days, planningWindow);
	const workedDaysPerMonth = getWorkedDaysPerMonth({
		ptoDays: days,
		holidays,
		year,
	});
	const efficiency = totalEffectiveDays / days.length;

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
