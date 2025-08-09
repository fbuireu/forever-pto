import type { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, isSameDay } from 'date-fns';

const SCORING = {
  BASE_MULTIPLIER: 10,

  BLOCK_SIZE_BONUS: {
    LARGE: { MIN_DAYS: 5, MULTIPLIER: 1.5 },
    MEDIUM: { MIN_DAYS: 3, MULTIPLIER: 1.2 },
  },

  ADJACENT_HOLIDAY_MULTIPLIER: 1.3,

  BRIDGE_BONUS: {
    LONG: { MIN_DAYS: 9, MULTIPLIER: 1.4 },
    MEDIUM: { MIN_DAYS: 7, MULTIPLIER: 1.2 },
  },

  SINGLE_DAY_PENALTY: {
    MAX_EFFICIENCY: 3,
    MULTIPLIER: 0.7,
  },
} as const;

export function calculateBlockScore({
  blockDays,
  effectiveDays,
  holidays,
}: {
  blockDays: Date[];
  effectiveDays: number;
  holidays: HolidayDTO[];
}): number {
  const ptoDays = blockDays.length;
  const efficiency = effectiveDays / ptoDays;

  let score = efficiency * SCORING.BASE_MULTIPLIER;

  // Bonus for long blocks
  if (ptoDays >= SCORING.BLOCK_SIZE_BONUS.LARGE.MIN_DAYS) {
    score *= SCORING.BLOCK_SIZE_BONUS.LARGE.MULTIPLIER;
  } else if (ptoDays >= SCORING.BLOCK_SIZE_BONUS.MEDIUM.MIN_DAYS) {
    score *= SCORING.BLOCK_SIZE_BONUS.MEDIUM.MULTIPLIER;
  }

  // Bonus for adjacent holidays
  const firstDay = blockDays[0];
  const lastDay = blockDays[blockDays.length - 1];
  const hasAdjacentHoliday = holidays.some((h) => {
    const holidayDate = new Date(h.date);
    const dayBefore = addDays(firstDay, -1);
    const dayAfter = addDays(lastDay, 1);
    return isSameDay(holidayDate, dayBefore) || isSameDay(holidayDate, dayAfter);
  });

  if (hasAdjacentHoliday) {
    score *= SCORING.ADJACENT_HOLIDAY_MULTIPLIER;
  }

  // Bonus for long bridges
  if (effectiveDays >= SCORING.BRIDGE_BONUS.LONG.MIN_DAYS) {
    score *= SCORING.BRIDGE_BONUS.LONG.MULTIPLIER;
  } else if (effectiveDays >= SCORING.BRIDGE_BONUS.MEDIUM.MIN_DAYS) {
    score *= SCORING.BRIDGE_BONUS.MEDIUM.MULTIPLIER;
  }

  // Penalty for single days with low efficiency
  if (ptoDays === 1 && efficiency < SCORING.SINGLE_DAY_PENALTY.MAX_EFFICIENCY) {
    score *= SCORING.SINGLE_DAY_PENALTY.MULTIPLIER;
  }

  return score;
}
