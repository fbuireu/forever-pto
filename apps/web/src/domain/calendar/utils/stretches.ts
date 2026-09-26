import { isWeekendIndex } from "@application/shared/utils/dates";

export interface WorkStretch {
	start: number;
	end: number;
}

interface OnlyWeekendBetweenParams {
	start: number;
	end: number;
}

const onlyWeekendBetween = ({ start, end }: OnlyWeekendBetweenParams) => {
	for (let day = start + 1; day < end; day++) {
		if (!isWeekendIndex(day)) return false;
	}
	return true;
};

export const workStretchesOf = (workdays: number[]): WorkStretch[] => {
	const stretches: WorkStretch[] = [];

	workdays.forEach((day, position) => {
		const last = stretches.at(-1);
		const previous = workdays[position - 1];
		if (last && previous !== undefined && onlyWeekendBetween({ start: previous, end: day })) {
			last.end = position;
		} else {
			stretches.push({ start: position, end: position });
		}
	});

	return stretches;
};

interface LongestWorkStretchParams {
	workdays: number[];
	off: Set<number>;
}

export const longestWorkStretch = ({ workdays, off }: LongestWorkStretchParams) =>
	workStretchesOf(workdays.filter((day) => !off.has(day))).reduce(
		(longest, { start, end }) => Math.max(longest, end - start + 1),
		0,
	);
