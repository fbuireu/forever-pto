import { dayIndex } from "@application/shared/utils/dates";
import { PTO_CONSTANTS } from "@domain/calendar/const";
import type { Bridge } from "@domain/calendar/types";
import { FilterStrategy } from "@domain/calendar/types";
import { quarterIndex } from "@domain/calendar/window";

const NO_NEIGHBOUR = Number.MAX_SAFE_INTEGER;

export interface Candidate {
	bridge: Bridge;
	newDays: number;
	marginalEfficiency: number;
	runLength: number;
	gap: number;
	overQuota: boolean;
}

export interface Objective {
	floor: number;
	rank: (candidate: Candidate) => number[];
}

interface CappedRunParams {
	runLength: number;
	cap: number;
}

const cappedRun = ({ runLength, cap }: CappedRunParams) => Math.min(runLength, cap) - Math.max(0, runLength - cap);

export const STRATEGY_OBJECTIVE: Record<FilterStrategy, Objective> = {
	[FilterStrategy.OPTIMIZED]: {
		floor: PTO_CONSTANTS.EFFICIENCY.MINIMUM,
		rank: ({ marginalEfficiency, runLength, gap }) => [marginalEfficiency, runLength, gap],
	},
	[FilterStrategy.GROUPED]: {
		floor: PTO_CONSTANTS.EFFICIENCY.BLOCK_MINIMUM,
		rank: ({ runLength, marginalEfficiency, gap }) => [
			cappedRun({ runLength, cap: PTO_CONSTANTS.SELECTION.GROUPED_MAX_BLOCK_DAYS }),
			marginalEfficiency,
			gap,
		],
	},
	[FilterStrategy.BALANCED]: {
		floor: PTO_CONSTANTS.EFFICIENCY.MINIMUM,
		rank: ({ overQuota, runLength, marginalEfficiency, gap }) => [
			Number(!overQuota),
			cappedRun({ runLength, cap: PTO_CONSTANTS.SELECTION.BALANCED_MAX_BLOCK_DAYS }),
			marginalEfficiency,
			gap,
		],
	},
};

export const objectiveFor = (strategy: FilterStrategy) =>
	STRATEGY_OBJECTIVE[strategy] ?? STRATEGY_OBJECTIVE[FilterStrategy.GROUPED];

interface OutranksParams {
	rank: number[];
	rival: number[];
}

const outranks = ({ rank, rival }: OutranksParams) => {
	for (const [index, value] of rank.entries()) {
		const difference = value - (rival[index] ?? 0);
		if (Math.abs(difference) > PTO_CONSTANTS.SELECTION.RANK_TOLERANCE) return difference > 0;
	}
	return false;
};

interface PoolEntry {
	bridge: Bridge;
	start: number;
	end: number;
	ptoDays: number[];
	quarter: number;
	newDays: number;
	runLength: number;
	gap: number;
	alive: boolean;
}

const toPoolEntry = (bridge: Bridge): PoolEntry => {
	const start = dayIndex(bridge.startDate);
	const end = dayIndex(bridge.endDate);

	return {
		bridge,
		start,
		end,
		ptoDays: bridge.ptoDays.map(dayIndex),
		quarter: quarterIndex(bridge.ptoDays[0] ?? bridge.startDate),
		newDays: end - start + 1,
		runLength: end - start + 1,
		gap: NO_NEIGHBOUR,
		alive: true,
	};
};

export interface SelectBridgesParams {
	bridges: Bridge[];
	targetPtoDays: number;
	objective: Objective;
	excludedDays?: Date[];
}

export const selectBridges = ({ bridges, targetPtoDays, objective, excludedDays = [] }: SelectBridgesParams) => {
	const excluded = new Set(excludedDays.map(dayIndex));
	const pool = bridges.map(toPoolEntry).filter(({ ptoDays }) => !ptoDays.some((day) => excluded.has(day)));
	const quarterQuota = Math.ceil(targetPtoDays / Math.max(new Set(pool.map(({ quarter }) => quarter)).size, 1));

	const covered = new Set<number>();
	const usedPtoDays = new Set<number>();
	const spentByQuarter = new Map<number, number>();
	const selected: Bridge[] = [];
	let spent = 0;

	const runAround = (start: number, end: number) => {
		let left = start;
		let right = end;
		while (covered.has(left - 1)) left--;
		while (covered.has(right + 1)) right++;
		return { left, right };
	};

	const take = (entry: PoolEntry) => {
		const { bridge, start, end, ptoDays, quarter } = entry;
		selected.push(bridge);
		for (let day = start; day <= end; day++) covered.add(day);
		for (const day of ptoDays) usedPtoDays.add(day);
		spentByQuarter.set(quarter, (spentByQuarter.get(quarter) ?? 0) + bridge.ptoDaysNeeded);
		spent += bridge.ptoDaysNeeded;

		const { left, right } = runAround(start, end);

		for (const other of pool) {
			if (!other.alive) continue;
			if (other.ptoDays.some((day) => usedPtoDays.has(day))) {
				other.alive = false;
				continue;
			}
			other.gap = Math.min(other.gap, Math.max(0, start - other.end, other.start - end));
			if (other.start <= end && other.end >= start) {
				let newDays = 0;
				for (let day = other.start; day <= other.end; day++) if (!covered.has(day)) newDays++;
				other.newDays = newDays;
			}
			if (other.start <= right + 1 && other.end >= left - 1) {
				const run = runAround(other.start, other.end);
				other.runLength = run.right - run.left + 1;
			}
		}
	};

	while (spent < targetPtoDays) {
		let best: { entry: PoolEntry; rank: number[] } | null = null;

		for (const entry of pool) {
			if (!entry.alive) continue;
			const { bridge, newDays, runLength, gap, quarter } = entry;
			if (spent + bridge.ptoDaysNeeded > targetPtoDays) continue;

			const marginalEfficiency = newDays / bridge.ptoDaysNeeded;
			if (marginalEfficiency + PTO_CONSTANTS.SELECTION.RANK_TOLERANCE < objective.floor) continue;

			const rank = objective.rank({
				bridge,
				newDays,
				marginalEfficiency,
				runLength,
				gap,
				overQuota: (spentByQuarter.get(quarter) ?? 0) + bridge.ptoDaysNeeded > quarterQuota,
			});
			if (best === null || outranks({ rank, rival: best.rank })) best = { entry, rank };
		}

		if (best === null) break;
		take(best.entry);
	}

	return {
		days: selected.flatMap((bridge) => bridge.ptoDays).toSorted((a, b) => a.getTime() - b.getTime()),
		bridges: selected,
	};
};

interface SelectBridgesForStrategyParams {
	bridges: Bridge[];
	targetPtoDays: number;
	strategy: FilterStrategy;
}

export const selectBridgesForStrategy = ({ bridges, targetPtoDays, strategy }: SelectBridgesForStrategyParams) =>
	selectBridges({ bridges, targetPtoDays, objective: objectiveFor(strategy) });
