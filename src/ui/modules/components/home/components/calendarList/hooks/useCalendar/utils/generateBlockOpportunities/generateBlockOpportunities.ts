import { DEFAULT_CALENDAR_LIMITS } from '@const/const';
import { differenceInDays, getMonth } from 'date-fns';
import type { BlockOpportunity, DayInfo } from '../../types';
import { calculateBlockScore } from '../calculateBlockScore/calculateBlockScore';
import { calculateSurroundingFreeDays } from '../calculateSurroundingFreeDays/calculateSurroundingFreeDays';
import type { EffectiveRatio } from '@modules/components/home/components/calendarList/hooks/types';

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

	for (let startDayIndex = 0; startDayIndex < availableWorkdays.length; startDayIndex++) {
		const startDay = availableWorkdays[startDayIndex];

		for (
			let blockSize = 1;
			blockSize <= Math.min(DEFAULT_CALENDAR_LIMITS.MAX_BLOCK_SIZE, remainingPtoDays);
			blockSize++
		) {
			if (startDayIndex + blockSize > availableWorkdays.length) {
				continue;
			}

			let validBlock = true;
			const blockDays: Date[] = [];

			for (let i = 0; i < blockSize; i++) {
				const day = availableWorkdays[startDayIndex + i];

				if (blockDays.length > 0) {
					const lastDay = blockDays[blockDays.length - 1];
					if (differenceInDays(day, lastDay) !== 1) {
						validBlock = false;
						break;
					}
				}

				blockDays.push(day);
			}

			if (!validBlock || blockDays.length === 0) continue;

			const { daysBeforeBlock, daysAfterBlock } = calculateSurroundingFreeDays({ blockDays, daysMap });
			const totalConsecutiveDays = daysBeforeBlock + blockSize + daysAfterBlock;

			const score = calculateBlockScore({ blockSize, totalConsecutiveDays });

			const effectiveResult = calculateEffectiveDays(blockDays);

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
