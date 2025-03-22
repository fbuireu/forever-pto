import { differenceInDays } from 'date-fns';

export function groupConsecutiveDays(days: Date[]): Date[][] {
	if (days.length === 0) return [];

	const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());
	const sequences: Date[][] = [];
	let currentSequence: Date[] = [sortedDays[0]];

	for (let i = 1; i < sortedDays.length; i++) {
		const prevDay = sortedDays[i - 1];
		const currentDay = sortedDays[i];

		if (differenceInDays(currentDay, prevDay) === 1) {
			currentSequence.push(currentDay);
		} else {
			sequences.push([...currentSequence]);
			currentSequence = [currentDay];
		}
	}

	if (currentSequence.length > 0) {
		sequences.push(currentSequence);
	}

	return sequences;
}
