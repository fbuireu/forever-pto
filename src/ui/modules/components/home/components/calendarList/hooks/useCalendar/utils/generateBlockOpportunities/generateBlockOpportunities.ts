import { DEFAULT_CALENDAR_LIMITS } from '@const/const';
import type { EffectiveRatio } from '@modules/components/home/components/calendarList/hooks/types';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';
import { differenceInDays, getMonth } from 'date-fns';
import type { BlockOpportunity, DayInfo } from '../../types';
import { calculateBlockScore } from '../calculateBlockScore/calculateBlockScore';
import { calculateSurroundingFreeDays } from '../calculateSurroundingFreeDays/calculateSurroundingFreeDays';

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

	const dayKeysMap = new Map<Date, string>();
	for (let i = 0; i < availableWorkdaysLength; i++) {
		dayKeysMap.set(availableWorkdays[i], getDateKey(availableWorkdays[i]));
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
				const day = availableWorkdays[startDayIndex + i];

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

			const score = calculateBlockScore({
				blockSize,
				totalConsecutiveDays,
				effectiveDays: effectiveResult.effective,
			});

			blockOpportunities.push({
				startDay: blockDays[0],
				days: blockDays,
				blockSize: blockDays.length,
				daysBeforeBlock,
				daysAfterBlock,
				totalConsecutiveDays,
				score,
				month: getMonth(blockDays[0]),
				effectiveDays: effectiveResult.effective,
			});
		}
	}

	return blockOpportunities.sort((a, b) => b.score - a.score);
}
