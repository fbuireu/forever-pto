import type { EffectiveRatio } from '@modules/components/home/components/calendarList/hooks/types';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';
import { groupConsecutiveDays } from '@modules/components/home/components/calendarList/hooks/utils/groupConsecutiveDays/groupConsecutiveDays';

interface CalculateEffectiveDaysParams {
	freeDaysBaseMap: Map<string, Date>;
	selectedPtoDays: Date[];
	ptoDaysToAdd?: Date[];
}

export function calculateEffectiveDays({
	freeDaysBaseMap,
	selectedPtoDays,
	ptoDaysToAdd = [],
}: CalculateEffectiveDaysParams): EffectiveRatio {
	if (selectedPtoDays.length === 0 && ptoDaysToAdd.length === 0) {
		return { effective: 0, ratio: 0 };
	}

	const freeDaysMap = new Map(freeDaysBaseMap);

	for (const day of selectedPtoDays) {
		const dayKey = getDateKey(day);
		if (!freeDaysMap.has(dayKey)) {
			freeDaysMap.set(dayKey, day);
		}
	}

	const freeDays = Array.from(freeDaysMap.values()).sort((a, b) => a.getTime() - b.getTime());
	const sequences = groupConsecutiveDays(freeDays);
	const ptoDayKeys = new Set([...selectedPtoDays.map(getDateKey), ...ptoDaysToAdd.map(getDateKey)]);
	let effectiveDays = 0;

	for (const sequence of sequences) {
		const hasAnyPtoDay = sequence.some((day) => ptoDayKeys.has(getDateKey(day)));

		if (hasAnyPtoDay) {
			effectiveDays += sequence.length;
		}
	}

	const totalPtoDays = ptoDayKeys.size;
	const ratio = Number.parseFloat((effectiveDays / totalPtoDays).toFixed(1));

	return { effective: effectiveDays, ratio };
}
