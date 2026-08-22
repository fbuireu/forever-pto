import { PTO_CONSTANTS } from "@domain/calendar/const";
import type { Bridge } from "@domain/calendar/types";
import { FilterStrategy } from "@domain/calendar/types";
import { getKey } from "@domain/calendar/utils/cache";
import { compareByEfficiency } from "@domain/calendar/utils/helpers";

export type Ordering = (bridges: Bridge[]) => Bridge[];

interface SelectBridgesForStrategyParams {
	bridges: Bridge[];
	targetPtoDays: number;
	strategy: FilterStrategy;
	presorted?: boolean;
}

const compareGrouped = (a: Bridge, b: Bridge) => {
	if (a.ptoDaysNeeded !== b.ptoDaysNeeded) {
		return b.ptoDaysNeeded - a.ptoDaysNeeded;
	}
	return b.efficiency - a.efficiency;
};

const isHighValue = (bridge: Bridge) => {
	const {
		EFFICIENCY: { ACCEPTABLE },
		SELECTION_WEIGHTS: { HIGH_VALUE_THRESHOLD_EFFECTIVE, HIGH_VALUE_THRESHOLD_DAYS },
	} = PTO_CONSTANTS;

	return (
		bridge.ptoDaysNeeded >= HIGH_VALUE_THRESHOLD_DAYS &&
		bridge.effectiveDays >= HIGH_VALUE_THRESHOLD_EFFECTIVE &&
		bridge.efficiency >= ACCEPTABLE
	);
};

const scoreOf = (bridge: Bridge) => {
	const {
		SCORING: { BASE_SCORE, MULTI_DAY_BONUS, EFFICIENCY, TOTAL_VALUE, VALUE_DIVISOR },
		SELECTION_WEIGHTS: { HIGH_VALUE_THRESHOLD_EFFECTIVE, HIGH_VALUE_THRESHOLD_DAYS },
	} = PTO_CONSTANTS;

	const multiDayBonus =
		bridge.ptoDaysNeeded >= HIGH_VALUE_THRESHOLD_DAYS && bridge.effectiveDays >= HIGH_VALUE_THRESHOLD_EFFECTIVE
			? MULTI_DAY_BONUS
			: BASE_SCORE;

	return (bridge.efficiency * EFFICIENCY + (bridge.effectiveDays / VALUE_DIVISOR) * TOTAL_VALUE) * multiDayBonus;
};

const byScore: Ordering = (bridges) => {
	const scores = new Map(bridges.map((bridge) => [bridge, scoreOf(bridge)]));

	return bridges.toSorted((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0));
};

const highValueFirst: Ordering = (bridges) => [
	...bridges.filter(isHighValue),
	...bridges.filter((b) => !isHighValue(b)),
];

export const STRATEGY_ORDERING: Record<FilterStrategy, Ordering> = {
	[FilterStrategy.GROUPED]: (bridges) => bridges.toSorted(compareGrouped),
	[FilterStrategy.OPTIMIZED]: (bridges) => bridges.toSorted(compareByEfficiency),
	[FilterStrategy.BALANCED]: (bridges) => highValueFirst(byScore(bridges)),
};

interface SelectGreedilyParams {
	orderedBridges: Bridge[];
	targetPtoDays: number;
}

export const selectGreedily = ({ orderedBridges, targetPtoDays }: SelectGreedilyParams) => {
	const selectedBridges: Bridge[] = [];
	const usedDates = new Set<string>();
	let spent = 0;

	for (const bridge of orderedBridges) {
		if (spent >= targetPtoDays) break;
		if (spent + bridge.ptoDaysNeeded > targetPtoDays) continue;
		if (bridge.ptoDays.some((day) => usedDates.has(getKey(day)))) continue;

		selectedBridges.push(bridge);
		for (const day of bridge.ptoDays) usedDates.add(getKey(day));
		spent += bridge.ptoDaysNeeded;
	}

	return {
		days: selectedBridges.flatMap((bridge) => bridge.ptoDays).toSorted((a, b) => a.getTime() - b.getTime()),
		bridges: selectedBridges,
	};
};

export const selectBridgesForStrategy = ({
	bridges,
	targetPtoDays,
	strategy,
	presorted = false,
}: SelectBridgesForStrategyParams) => {
	const order = STRATEGY_ORDERING[strategy] ?? STRATEGY_ORDERING[FilterStrategy.GROUPED];

	return selectGreedily({ orderedBridges: presorted ? bridges : order(bridges), targetPtoDays });
};
