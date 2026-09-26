import { dayIndex } from "@application/shared/utils/dates";
import { PTO_CONSTANTS } from "@domain/calendar/const";
import type { Bridge } from "@domain/calendar/types";
import { FilterStrategy } from "@domain/calendar/types";
import type { PlanMeasures } from "@domain/calendar/utils/measures";
import { workStretchesOf } from "@domain/calendar/utils/stretches";
import { inPreferredMonths } from "@domain/calendar/window";

const NO_NEIGHBOUR = Number.MAX_SAFE_INTEGER;

interface DaySpan {
	start: number;
	end: number;
}

export interface Candidate {
	bridge: Bridge;
	marginalEfficiency: number;
	runLength: number;
	gap: number;
	longestStretchAfter: number;
	stretchRelief: number;
	inPreferredMonths: boolean;
	joinsBlock: boolean;
	planIsEmpty: boolean;
}

export interface Objective {
	floor: number;
	rank: (candidate: Candidate) => number[];
	aim: (measures: PlanMeasures) => number;
	admits?: (candidate: Candidate) => boolean;
	next?: Objective;
}

interface CappedRunParams {
	runLength: number;
	cap: number;
}

const cappedRun = ({ runLength, cap }: CappedRunParams) => Math.min(runLength, cap) - Math.max(0, runLength - cap);

const OPTIMIZED_OBJECTIVE: Objective = {
	floor: PTO_CONSTANTS.EFFICIENCY.MINIMUM,
	aim: ({ covered }) => covered,
	rank: ({ marginalEfficiency, runLength, gap }) => [marginalEfficiency, runLength, gap],
};

export const STRATEGY_OBJECTIVE: Record<FilterStrategy, Objective> = {
	[FilterStrategy.OPTIMIZED]: OPTIMIZED_OBJECTIVE,
	[FilterStrategy.GROUPED]: {
		floor: PTO_CONSTANTS.EFFICIENCY.BLOCK_MINIMUM,
		aim: ({ longestVacation }) =>
			cappedRun({ runLength: longestVacation, cap: PTO_CONSTANTS.SELECTION.GROUPED_MAX_BLOCK_DAYS }),
		rank: ({ runLength, marginalEfficiency, gap }) => [
			cappedRun({ runLength, cap: PTO_CONSTANTS.SELECTION.GROUPED_MAX_BLOCK_DAYS }),
			marginalEfficiency,
			gap,
		],
	},
	[FilterStrategy.BALANCED]: {
		floor: PTO_CONSTANTS.EFFICIENCY.MINIMUM,
		aim: ({ longestWorkStretch }) => -longestWorkStretch,
		rank: ({ bridge, longestStretchAfter, stretchRelief, runLength, marginalEfficiency, gap }) => [
			-longestStretchAfter,
			stretchRelief / bridge.ptoDaysNeeded,
			cappedRun({ runLength, cap: PTO_CONSTANTS.SELECTION.BALANCED_MAX_BLOCK_DAYS }),
			marginalEfficiency,
			gap,
		],
	},
	[FilterStrategy.MAIN_VACATION]: {
		floor: PTO_CONSTANTS.EFFICIENCY.BLOCK_MINIMUM,
		aim: ({ longestPreferredVacation }) =>
			Math.min(longestPreferredVacation, PTO_CONSTANTS.SELECTION.MAIN_VACATION_BLOCK_DAYS),
		admits: ({ inPreferredMonths, runLength, planIsEmpty, joinsBlock }) =>
			inPreferredMonths && runLength <= PTO_CONSTANTS.SELECTION.MAIN_VACATION_BLOCK_DAYS && (planIsEmpty || joinsBlock),
		rank: ({ runLength, marginalEfficiency, gap }) => [runLength, marginalEfficiency, gap],
		next: OPTIMIZED_OBJECTIVE,
	},
};

export const objectiveFor = (strategy: FilterStrategy) =>
	STRATEGY_OBJECTIVE[strategy] ?? STRATEGY_OBJECTIVE[FilterStrategy.GROUPED];

export interface OutranksParams {
	rank: number[];
	rival: number[];
}

export const outranks = ({ rank, rival }: OutranksParams) => {
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
	inPreferredMonths: boolean;
	newDays: number;
	runLength: number;
	gap: number;
	alive: boolean;
}

interface ToPoolEntryParams {
	bridge: Bridge;
	preferredMonths: Set<number>;
}

const toPoolEntry = ({ bridge, preferredMonths }: ToPoolEntryParams): PoolEntry => {
	const start = dayIndex(bridge.startDate);
	const end = dayIndex(bridge.endDate);

	return {
		bridge,
		start,
		end,
		ptoDays: bridge.ptoDays.map(dayIndex),
		inPreferredMonths: inPreferredMonths({ months: bridge.ptoDays.map((day) => day.getMonth()), preferredMonths }),
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
	forbiddenDays?: Date[];
	preferredMonths?: number[];
	workdays: Date[];
	alreadyOff: Date[];
}

export const selectBridges = ({
	bridges,
	targetPtoDays,
	objective,
	forbiddenDays = [],
	preferredMonths = [],
	workdays,
	alreadyOff,
}: SelectBridgesParams) => {
	const forbidden = new Set(forbiddenDays.map(dayIndex));
	const preferred = new Set(preferredMonths);
	const pool = bridges
		.map((bridge) => toPoolEntry({ bridge, preferredMonths: preferred }))
		.filter(({ ptoDays }) => ptoDays.length > 0 && !ptoDays.some((day) => forbidden.has(day)));

	const workdayIndexes = [...new Set(workdays.map(dayIndex))].toSorted((a, b) => a - b);
	const positionOf = new Map(workdayIndexes.map((day, position) => [day, position]));
	let stretches = workStretchesOf(workdayIndexes);

	const covered = new Set<number>();
	const alreadyFree = new Set(alreadyOff.map(dayIndex));
	const isOff = (day: number) => covered.has(day) || alreadyFree.has(day);
	const usedPtoDays = new Set<number>();
	const selected: Bridge[] = [];
	let spent = 0;

	const runAround = ({ start, end }: DaySpan): DaySpan => {
		let left = start;
		let right = end;
		while (covered.has(left - 1)) left--;
		while (covered.has(right + 1)) right++;
		return { start: left, end: right };
	};

	const countNewDays = ({ start, end }: DaySpan) => {
		let newDays = 0;
		for (let day = start; day <= end; day++) if (!isOff(day)) newDays++;
		return newDays;
	};

	const countFreshDays = ({ start, end }: DaySpan) => {
		let freshDays = 0;
		for (let day = start; day <= end; day++) if (!covered.has(day)) freshDays++;
		return freshDays;
	};

	if (alreadyFree.size > 0) {
		for (const entry of pool) entry.newDays = countNewDays(entry);
	}

	const stretchIndexOf = (position: number) => {
		let low = 0;
		let high = stretches.length - 1;
		while (low <= high) {
			const middle = (low + high) >> 1;
			const stretch = stretches[middle];
			if (stretch === undefined) return -1;
			if (position < stretch.start) high = middle - 1;
			else if (position > stretch.end) low = middle + 1;
			else return middle;
		}
		return -1;
	};

	const lengthOf = ({ start, end }: DaySpan) => Math.max(0, end - start + 1);

	let longest = { index: -1, length: 0, runnerUp: 0 };

	const rankStretches = () => {
		longest = { index: -1, length: 0, runnerUp: 0 };
		stretches.forEach((stretch, index) => {
			const length = lengthOf(stretch);
			if (length > longest.length) longest = { index, length, runnerUp: longest.length };
			else if (length > longest.runnerUp) longest.runnerUp = length;
		});
	};

	rankStretches();

	const stretchesAfter = ({ ptoDays }: PoolEntry) => {
		const unchanged = { longestStretchAfter: longest.length, stretchRelief: 0 };
		const positions = ptoDays.map((day) => positionOf.get(day)).filter((position) => position !== undefined);
		const first = positions.at(0);
		const last = positions.at(-1);
		if (first === undefined || last === undefined) return unchanged;

		const index = stretchIndexOf(first);
		const stretch = stretches[index];
		if (stretch === undefined) return unchanged;

		const others = index === longest.index ? longest.runnerUp : longest.length;
		const before = first - stretch.start;
		const after = stretch.end - last;
		const length = lengthOf(stretch);
		return {
			longestStretchAfter: Math.max(others, before, after),
			stretchRelief: length * length - before * before - after * after,
		};
	};

	const splitStretches = ({ ptoDays }: PoolEntry) => {
		const positions = ptoDays.map((day) => positionOf.get(day)).filter((position) => position !== undefined);
		const first = positions.at(0);
		const last = positions.at(-1);
		if (first === undefined || last === undefined) return;

		const index = stretchIndexOf(first);
		const stretch = stretches[index];
		if (stretch === undefined) return;

		const parts = [
			{ start: stretch.start, end: first - 1 },
			{ start: last + 1, end: stretch.end },
		].filter((part) => lengthOf(part) > 0);
		stretches = [...stretches.slice(0, index), ...parts, ...stretches.slice(index + 1)];
		rankStretches();
	};

	const take = (entry: PoolEntry) => {
		const { bridge, start, end, ptoDays } = entry;
		selected.push(bridge);
		for (let day = start; day <= end; day++) covered.add(day);
		for (const day of ptoDays) usedPtoDays.add(day);
		spent += bridge.ptoDaysNeeded;
		splitStretches(entry);

		const merged = runAround({ start, end });

		for (const other of pool) {
			if (!other.alive) continue;
			if (other.ptoDays.some((day) => usedPtoDays.has(day))) {
				other.alive = false;
				continue;
			}
			other.gap = Math.min(other.gap, Math.max(0, start - other.end, other.start - end));
			if (other.start <= end && other.end >= start) other.newDays = countNewDays(other);
			if (other.start <= merged.end + 1 && other.end >= merged.start - 1) {
				const run = runAround(other);
				other.runLength = run.end - run.start + 1;
			}
		}
	};

	const bestUnder = (stage: Objective) => {
		let best: { entry: PoolEntry; rank: number[] } | null = null;

		for (const entry of pool) {
			if (!entry.alive) continue;
			const { bridge, newDays, runLength, gap, inPreferredMonths } = entry;
			if (spent + bridge.ptoDaysNeeded > targetPtoDays) continue;

			const marginalEfficiency = newDays / bridge.ptoDaysNeeded;
			if (marginalEfficiency + PTO_CONSTANTS.SELECTION.RANK_TOLERANCE < stage.floor) continue;

			const candidate: Candidate = {
				bridge,
				marginalEfficiency,
				runLength,
				gap,
				...stretchesAfter(entry),
				inPreferredMonths,
				joinsBlock: runLength > countFreshDays(entry),
				planIsEmpty: selected.length === 0,
			};
			if (stage.admits && !stage.admits(candidate)) continue;

			const rank = stage.rank(candidate);
			if (best === null || outranks({ rank, rival: best.rank })) best = { entry, rank };
		}

		return best?.entry ?? null;
	};

	let stage: Objective | undefined = objective;

	while (stage && spent < targetPtoDays) {
		const best = bestUnder(stage);
		if (best === null) {
			stage = stage.next;
			continue;
		}
		take(best);
	}

	return {
		days: selected.flatMap((bridge) => bridge.ptoDays).toSorted((a, b) => a.getTime() - b.getTime()),
		bridges: selected,
	};
};

interface SelectBridgesForStrategyParams extends Omit<SelectBridgesParams, "objective" | "forbiddenDays"> {
	strategy: FilterStrategy;
}

export const selectBridgesForStrategy = ({ strategy, ...params }: SelectBridgesForStrategyParams) =>
	selectBridges({ ...params, objective: objectiveFor(strategy) });
