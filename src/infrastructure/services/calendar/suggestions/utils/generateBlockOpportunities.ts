import type { HolidayDTO } from '@application/dto/holiday/types';
import { differenceInDays } from 'date-fns';
import type { Block } from '../types';
import { calculateBlockScore } from './calculateBlockScore';
import { calculateEffectiveDays } from './calculateEffectiveDays';

export function generateBlockOpportunities({
  availableWorkdays,
  holidays,
  maxBlockSize,
}: {
  availableWorkdays: Date[];
  holidays: HolidayDTO[];
  maxBlockSize: number;
}) {
  const opportunities: Block[] = [];

  for (let i = 0; i < availableWorkdays.length; i++) {
    for (let size = 1; size <= maxBlockSize; size++) {
      const block = tryCreateBlock({
        startIndex: i,
        size,
        workdays: availableWorkdays,
        holidays,
      });

      if (block) {
        opportunities.push(block);
      }
    }
  }

  return opportunities.sort((a, b) => b.score - a.score);
}

function tryCreateBlock({
  startIndex,
  size,
  workdays,
  holidays,
}: {
  startIndex: number;
  size: number;
  workdays: Date[];
  holidays: HolidayDTO[];
}) {
  if (startIndex + size > workdays.length) return null;

  const blockDays: Date[] = [];

  for (let i = 0; i < size; i++) {
    const currentDay = workdays[startIndex + i];

    if (i > 0) {
      const prevDay = blockDays[i - 1];
      const daysBetween = differenceInDays(currentDay, prevDay);

      if (daysBetween > 4) return null;
    }

    blockDays.push(currentDay);
  }

  const effectiveDays = calculateEffectiveDays(blockDays, holidays);
  const score = calculateBlockScore({
    blockDays,
    effectiveDays,
    holidays,
  });

  return {
    days: blockDays,
    effectiveDays,
    score,
  };
}
