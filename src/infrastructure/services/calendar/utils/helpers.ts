import { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';
import { PTO_CONSTANTS } from '../const';
import { OptimizationStrategy } from '../types';

export function getCombinationKey(days: Date[]): string {
  return days
    .map((d) => getDateKey(d))
    .sort((a, b) => a.localeCompare(b))
    .join(',');
}

export function isFreeDay(date: Date, holidaySet: Set<string>): boolean {
  return isWeekend(date) || holidaySet.has(getDateKey(date));
}

export function createHolidaySet(holidays: HolidayDTO[]): Set<string> {
  return new Set(
    holidays
      .filter((h) => {
        const date = new Date(h.date);
        return !isWeekend(date);
      })
      .map((h) => {
        const date = new Date(h.date);
        return getDateKey(date);
      })
  );
}

export const getDateKey = (date: Date): string => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function getAvailableWorkdays({
  months,
  holidays,
  allowPastDays,
}: {
  months: Date[];
  holidays: HolidayDTO[];
  allowPastDays: boolean;
}): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const holidaySet = new Set<string>();
  for (const holiday of holidays) {
    const date = new Date(holiday.date);
    if (!isWeekend(date)) {
      const key = getDateKey(date);
      holidaySet.add(key);
    }
  }

  const workdays: Date[] = [];

  for (const month of months) {
    const year = month.getFullYear();
    const monthNum = month.getMonth();

    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);

      if (!allowPastDays && date.getTime() < todayTime) continue;

      if (isWeekend(date)) continue;

      const key = getDateKey(date);
      if (holidaySet.has(key)) continue;

      workdays.push(date);
    }
  }

  return workdays;
}

export function getStrategyConfig(strategy: OptimizationStrategy) {
  return PTO_CONSTANTS.STRATEGY_CONFIG[strategy];
}

export function validateSuggestionForStrategy(
  suggestion: { days: Date[]; efficiency?: number },
  strategy: OptimizationStrategy
): boolean {
  const config = getStrategyConfig(strategy);

  if (suggestion.efficiency && suggestion.efficiency < config.minEfficiency) {
    return false;
  }

  if (!config.allowSingleDays && suggestion.days.length === 1) {
    return false;
  }

  return true;
}

export function adjustScoreForStrategy(
  baseScore: number,
  day: Date,
  strategy: OptimizationStrategy,
  context?: {
    isNearExistingBlock?: boolean;
    distanceToBlock?: number;
    createsLongBlock?: boolean;
  }
): number {
  const config = getStrategyConfig(strategy);
  let adjustedScore = baseScore;

  if (strategy === 'grouped') {
    if (!context?.isNearExistingBlock) {
      adjustedScore *= PTO_CONSTANTS.SCORING.GROUPED_PENALTY;
    }

    if (context?.isNearExistingBlock && context.distanceToBlock) {
      const proximityBonus = Math.max(0, PTO_CONSTANTS.SCORING.PROXIMITY_BONUS - context.distanceToBlock);
      adjustedScore += proximityBonus;
    }

    if (context?.createsLongBlock) {
      adjustedScore *= PTO_CONSTANTS.SCORING.GROUPED_BONUS;
    }
  } else if (strategy === 'optimized') {
  } else if (strategy === 'balanced') {
    if (context?.isNearExistingBlock && context.distanceToBlock) {
      const proximityBonus = Math.max(0, PTO_CONSTANTS.SCORING.BALANCED_PROXIMITY_BONUS - context.distanceToBlock);
      adjustedScore += proximityBonus;
    }
  }

  return adjustedScore;
}
