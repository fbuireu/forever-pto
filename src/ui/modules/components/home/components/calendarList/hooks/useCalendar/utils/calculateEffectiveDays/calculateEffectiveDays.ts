import type { EffectiveRatio } from "@modules/components/home/components/calendarList/hooks/types";
import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";
import { groupConsecutiveDays } from "@modules/components/home/components/calendarList/hooks/utils/groupConsecutiveDays/groupConsecutiveDays";
import { isWeekend } from "date-fns";

interface CalculateEffectiveDaysParams {
	freeDaysBaseMap: Map<string, Date>;
	ptoDays: Date[];
}

export function calculateEffectiveDays({ freeDaysBaseMap, ptoDays }: CalculateEffectiveDaysParams): EffectiveRatio {
	if (ptoDays.length === 0) {
		return { effective: 0, ratio: 0 };
	}

	const freeDaysMap = new Map(freeDaysBaseMap);

	for (const day of ptoDays) {
		const dayKey = getDateKey(day);
		if (!freeDaysMap.has(dayKey)) {
			freeDaysMap.set(dayKey, day);
		}
	}

	const freeDays = Array.from(freeDaysMap.values()).sort((a, b) => a.getTime() - b.getTime());
	const sequences = groupConsecutiveDays(freeDays);
	const ptoDayKeys = new Set(ptoDays.map(getDateKey));

	let effectiveDays = 0;
	for (const sequence of sequences) {
		const ptoInSequence = sequence.filter((day) => ptoDayKeys.has(getDateKey(day)));
		if (ptoInSequence.length === 0) continue;

		const hasWeekdayHolidays = sequence.some((day) => {
			const dayKey = getDateKey(day);
			return freeDaysBaseMap.has(dayKey) && !isWeekend(day) && !ptoDayKeys.has(dayKey);
		});

		if (!hasWeekdayHolidays) {
			// Only PTO days, no benefit from holidays
			effectiveDays += ptoInSequence.length;
		} else {
			// Benefits from weekday holidays - count entire sequence
			effectiveDays += sequence.length;
		}
	}

	const ratio = Number.parseFloat((effectiveDays / ptoDays.length).toFixed(1));

	return { effective: effectiveDays, ratio };
}
