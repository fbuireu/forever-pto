import { isWeekendIndex } from "@application/shared/utils/dates";
import { type DaySpan, spanLength } from "./spans";

const onlyWeekendBetween = ({ start, end }: DaySpan) => {
	for (let day = start + 1; day < end; day++) {
		if (!isWeekendIndex(day)) return false;
	}
	return true;
};

export const workStretchesOf = (workdays: number[]): DaySpan[] => {
	const stretches: DaySpan[] = [];

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
		(longest, stretch) => Math.max(longest, spanLength(stretch)),
		0,
	);
