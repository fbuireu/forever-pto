import { dayIndex } from "@application/shared/utils/dates";
import { PTO_CONSTANTS } from "@domain/calendar/const";
import type { Bridge } from "@domain/calendar/types";
import { FilterStrategy } from "@domain/calendar/types";
import type { PlanMeasures } from "@domain/calendar/utils/measures";
import { type DaySpan, spanLength } from "@domain/calendar/utils/spans";
import { workStretchesOf } from "@domain/calendar/utils/stretches";
import { inPreferredMonths, monthKeyOf } from "@domain/calendar/window";

const NO_NEIGHBOUR = Number.MAX_SAFE_INTEGER;

export interface Candidate {
	bridge: Bridge;
	marginalEfficiency: number;
	runLength: number;
	gap: number;
	longestStretchAfter: number;
	stretchRelief: number;
	isPreferred: boolean;
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
		admits: ({ isPreferred, runLength, planIsEmpty, joinsBlock }) =>
			isPreferred && runLength <= PTO_CONSTANTS.SELECTION.MAIN_VACATION_BLOCK_DAYS && (planIsEmpty || joinsBlock),
		rank: ({ runLength, marginalEfficiency, gap }) => [runLength, marginalEfficiency, gap],
		next: OPTIMIZED_OBJECTIVE,
	},
};

export const objectiveFor = (strategy: FilterStrategy) =>
	STRATEGY_OBJECTIVE[strategy] ?? STRATEGY_OBJECTIVE[FilterStrategy.GROUPED];

interface OutranksParams {
	rank: number[];
	rival: number[];
}

export const outranks = ({ rank, rival }: OutranksParams) => {
	for (let index = 0; index < rank.length; index++) {
		const difference = (rank[index] as number) - (rival[index] ?? 0);
		if (Math.abs(difference) > PTO_CONSTANTS.SELECTION.RANK_TOLERANCE) return difference > 0;
	}
	return false;
};

interface PoolEntry {
	bridge: Bridge;
	start: number;
	end: number;
	ptoDays: number[];
	isPreferred: boolean;
	newDays: number;
	runLength: number;
	gap: number;
	alive: boolean;
	freshDays: number;
	first: number | undefined;
	last: number | undefined;
}

interface ToPoolEntryParams {
	bridge: Bridge;
	preferredMonths: Set<number>;
}

const toPoolEntry = ({ bridge, preferredMonths }: ToPoolEntryParams): PoolEntry => {
	const start = dayIndex(bridge.startDate);
	const end = dayIndex(bridge.endDate);
	const length = spanLength({ start, end });

	return {
		bridge,
		start,
		end,
		ptoDays: bridge.ptoDays.map(dayIndex),
		isPreferred: inPreferredMonths({ months: bridge.ptoDays.map(monthKeyOf), preferredMonths }),
		newDays: length,
		runLength: length,
		gap: NO_NEIGHBOUR,
		alive: true,
		freshDays: length,
		first: undefined,
		last: undefined,
	};
};

interface CountDaysParams {
	span: DaySpan;
	isCounted: (day: number) => boolean;
}

const countDays = ({ span: { start, end }, isCounted }: CountDaysParams) => {
	let count = 0;
	for (let day = start; day <= end; day++) if (isCounted(day)) count++;
	return count;
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
	for (const entry of pool) {
		for (const day of entry.ptoDays) {
			const position = positionOf.get(day);
			if (position === undefined) continue;
			if (entry.first === undefined) entry.first = position;
			entry.last = position;
		}
	}

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

	const isNew = (day: number) => !isOff(day);
	const isFresh = (day: number) => !covered.has(day);

	if (alreadyFree.size > 0) {
		for (const entry of pool) entry.newDays = countDays({ span: entry, isCounted: isNew });
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

	let longest = { index: -1, length: 0, runnerUp: 0 };

	const rankStretches = () => {
		longest = { index: -1, length: 0, runnerUp: 0 };
		stretches.forEach((stretch, index) => {
			const length = spanLength(stretch);
			if (length > longest.length) longest = { index, length, runnerUp: longest.length };
			else if (length > longest.runnerUp) longest.runnerUp = length;
		});
	};

	rankStretches();

	const stretchesAfter = ({ first, last }: PoolEntry) => {
		const unchanged = { longestStretchAfter: longest.length, stretchRelief: 0 };
		if (first === undefined || last === undefined) return unchanged;

		const index = stretchIndexOf(first);
		const stretch = stretches[index];
		if (stretch === undefined) return unchanged;

		const others = index === longest.index ? longest.runnerUp : longest.length;
		const before = first - stretch.start;
		const after = stretch.end - last;
		const length = spanLength(stretch);
		return {
			longestStretchAfter: Math.max(others, before, after),
			stretchRelief: length * length - before * before - after * after,
		};
	};

	const splitStretches = ({ first, last }: PoolEntry) => {
		if (first === undefined || last === undefined) return;

		const index = stretchIndexOf(first);
		const stretch = stretches[index];
		if (stretch === undefined) return;

		const parts = [
			{ start: stretch.start, end: first - 1 },
			{ start: last + 1, end: stretch.end },
		].filter((part) => spanLength(part) > 0);
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
			const overlaps = other.start <= end && other.end >= start;
			if (overlaps && other.ptoDays.some((day) => usedPtoDays.has(day))) {
				other.alive = false;
				continue;
			}
			other.gap = Math.min(other.gap, Math.max(0, start - other.end, other.start - end));
			if (overlaps) {
				other.newDays = countDays({ span: other, isCounted: isNew });
				other.freshDays = countDays({ span: other, isCounted: isFresh });
			}
			if (other.start <= merged.end + 1 && other.end >= merged.start - 1) {
				other.runLength = spanLength(runAround(other));
			}
		}
	};

	const bestUnder = (stage: Objective) => {
		let best: { entry: PoolEntry; rank: number[] } | null = null;
		const planIsEmpty = selected.length === 0;

		for (const entry of pool) {
			if (!entry.alive) continue;
			const { bridge, newDays, runLength, gap, isPreferred } = entry;
			if (spent + bridge.ptoDaysNeeded > targetPtoDays) continue;

			const marginalEfficiency = newDays / bridge.ptoDaysNeeded;
			if (marginalEfficiency + PTO_CONSTANTS.SELECTION.RANK_TOLERANCE < stage.floor) continue;

			const after = stretchesAfter(entry);
			const candidate: Candidate = {
				bridge,
				marginalEfficiency,
				runLength,
				gap,
				longestStretchAfter: after.longestStretchAfter,
				stretchRelief: after.stretchRelief,
				isPreferred,
				joinsBlock: runLength > entry.freshDays,
				planIsEmpty,
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
