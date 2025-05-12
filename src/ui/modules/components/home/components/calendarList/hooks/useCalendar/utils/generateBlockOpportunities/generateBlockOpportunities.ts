import { DEFAULT_CALENDAR_LIMITS } from "@const/const";
import type { EffectiveRatio } from "@modules/components/home/components/calendarList/hooks/types";
import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";
import { addDays, differenceInDays, getMonth, startOfWeek } from "date-fns";
import type { BlockOpportunity, DayInfo } from "../../types";
import { calculateBlockScore } from "../calculateBlockScore/calculateBlockScore";
import { calculateSurroundingFreeDays } from "../calculateSurroundingFreeDays/calculateSurroundingFreeDays";

interface GenerateBlockOpportunitiesParams {
	availableWorkdays: Date[];
	daysMap: Map<string, DayInfo>;
	remainingPtoDays: number;
	calculateEffectiveDays: (days: Date[]) => EffectiveRatio;
}

export function generateBlockOpportunities({
	availableWorkdays,
	daysMap,
	remainingPtoDays,
	calculateEffectiveDays,
}: GenerateBlockOpportunitiesParams): BlockOpportunity[] {
	const blockOpportunities: BlockOpportunity[] = [];
	const maxBlockSize = Math.min(DEFAULT_CALENDAR_LIMITS.MAX_BLOCK_SIZE, remainingPtoDays);
	const availableWorkdaysLength = availableWorkdays.length;
	const sortedWorkdays = [...availableWorkdays].sort((a, b) => a.getTime() - b.getTime());
	const dayKeysMap = new Map<Date, string>();
	for (let i = 0; i < availableWorkdaysLength; i++) {
		dayKeysMap.set(sortedWorkdays[i], getDateKey(sortedWorkdays[i]));
	}

	function evaluateWeekHolidayValue(weekStart: Date): number {
		let holidayCount = 0;
		const weekEnd = addDays(weekStart, 6);

		for (let day = weekStart; day <= weekEnd; day = addDays(day, 1)) {
			const dayKey = getDateKey(day);
			const dayInfo = daysMap.get(dayKey);

			if (dayInfo && (dayInfo.isHoliday || dayInfo.isWeekend)) {
				holidayCount++;
			}
		}

		return holidayCount;
	}

	for (let startDayIndex = 0; startDayIndex < availableWorkdaysLength; startDayIndex++) {
		for (let blockSize = 1; blockSize <= maxBlockSize; blockSize++) {
			if (startDayIndex + blockSize > availableWorkdaysLength) {
				continue;
			}

			let validBlock = true;
			const blockDays: Date[] = [];
			blockDays.length = blockSize;

			for (let i = 0; i < blockSize; i++) {
				const day = sortedWorkdays[startDayIndex + i];

				if (i > 0) {
					const lastDay = blockDays[i - 1];
					if (differenceInDays(day, lastDay) !== 1) {
						validBlock = false;
						break;
					}
				}

				blockDays[i] = day;
			}

			if (!validBlock || blockDays.length === 0) continue;

			const { daysBeforeBlock, daysAfterBlock } = calculateSurroundingFreeDays({ blockDays, daysMap });
			const totalConsecutiveDays = daysBeforeBlock + blockSize + daysAfterBlock;

			const effectiveResult = calculateEffectiveDays(blockDays);

			const weekStart = startOfWeek(blockDays[0]);
			const holidayValue = evaluateWeekHolidayValue(weekStart);

			const baseScore = calculateBlockScore({
				blockSize,
				totalConsecutiveDays,
				effectiveDays: effectiveResult.effective,
			});

			const adjustedScore = baseScore * (1 + holidayValue);

			blockOpportunities.push({
				startDay: blockDays[0],
				days: blockDays,
				blockSize: blockDays.length,
				daysBeforeBlock,
				daysAfterBlock,
				totalConsecutiveDays,
				score: adjustedScore,
				month: getMonth(blockDays[0]),
				effectiveDays: effectiveResult.effective,
			});
		}
	}

	return blockOpportunities.sort((a, b) => b.score - a.score);
}
