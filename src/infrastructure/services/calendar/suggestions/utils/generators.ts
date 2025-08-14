import type { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, isSameDay, isWeekend, subDays } from 'date-fns';

interface OptimalDaysParams {
  availableWorkdays: Date[];
  holidays: HolidayDTO[];
  targetPtoDays: number;
  maxSequenceSize?: number;
}

export function findOptimalDays(params: OptimalDaysParams): Date[] {
  const { availableWorkdays, holidays, targetPtoDays } = params;

  if (targetPtoDays <= 0 || availableWorkdays.length === 0) {
    return [];
  }

  if (availableWorkdays.length < targetPtoDays) {
    return availableWorkdays.slice(0, targetPtoDays);
  }

  // Create holiday set for fast lookup
  const holidaySet = new Set(holidays.map((h) => `${h.date.getFullYear()}-${h.date.getMonth()}-${h.date.getDate()}`));

  // Score each available workday
  const scoredDays = availableWorkdays.map((day) => ({
    day,
    score: calculateDayScore(day, holidaySet),
  }));

  // Sort by score (highest first)
  scoredDays.sort((a, b) => b.score - a.score);

  // For few days, try to find optimal combinations
  if (targetPtoDays <= 5) {
    return findOptimalCombination(scoredDays, targetPtoDays, holidays);
  }

  // For many days, take consecutive high-scoring days
  return scoredDays
    .slice(0, targetPtoDays)
    .map((item) => item.day)
    .sort((a, b) => a.getTime() - b.getTime());
}

function calculateDayScore(day: Date, holidaySet: Set<string>): number {
  let score = 1; // Base score
  const dayOfWeek = day.getDay();

  // Monday and Friday bonus (bridge potential)
  if (dayOfWeek === 1 || dayOfWeek === 5) {
    score += 2;
  }

  // Check adjacent days for holidays/weekends
  const prevDay = subDays(day, 1);
  const nextDay = addDays(day, 1);

  const prevKey = `${prevDay.getFullYear()}-${prevDay.getMonth()}-${prevDay.getDate()}`;
  const nextKey = `${nextDay.getFullYear()}-${nextDay.getMonth()}-${nextDay.getDate()}`;

  // Holiday adjacent bonus
  if (holidaySet.has(prevKey) || holidaySet.has(nextKey)) {
    score += 3;
  }

  // Weekend adjacent bonus (especially for Friday/Monday)
  if (isWeekend(prevDay) || isWeekend(nextDay)) {
    if (dayOfWeek === 1 || dayOfWeek === 5) {
      score += 2; // Extended weekend bonus
    }
  }

  return score;
}

function findOptimalCombination(
  scoredDays: Array<{ day: Date; score: number }>,
  targetDays: number,
  holidays: HolidayDTO[]
): Date[] {
  let bestCombination: Date[] = [];
  let bestEffectiveDays = 0;
  let bestScore = 0;

  // Limit search space for performance
  const candidates = Math.min(scoredDays.length, targetDays * 8);

  function generateCombinations(start: number, current: Date[], remaining: number) {
    if (remaining === 0) {
      const effectiveDays = calculateTotalEffectiveDays(current, holidays);
      const totalScore = current.reduce((sum, day) => {
        const scored = scoredDays.find((s) => s.day.getTime() === day.getTime());
        return sum + (scored?.score || 0);
      }, 0);

      if (effectiveDays > bestEffectiveDays || (effectiveDays === bestEffectiveDays && totalScore > bestScore)) {
        bestEffectiveDays = effectiveDays;
        bestScore = totalScore;
        bestCombination = [...current];
      }
      return;
    }

    for (let i = start; i < candidates && i <= scoredDays.length - remaining; i++) {
      current.push(scoredDays[i].day);
      generateCombinations(i + 1, current, remaining - 1);
      current.pop();
    }
  }

  generateCombinations(0, [], targetDays);

  return bestCombination.length > 0
    ? bestCombination.sort((a, b) => a.getTime() - b.getTime())
    : scoredDays.slice(0, targetDays).map((item) => item.day);
}

function calculateTotalEffectiveDays(days: Date[], holidays: HolidayDTO[]): number {
  if (days.length === 0) return 0;

  const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  let totalDays = 0;

  // Count workdays in the range
  let current = new Date(firstDay);
  while (current <= lastDay) {
    if (!isWeekend(current)) {
      totalDays++;
    }
    current = addDays(current, 1);
  }

  // Add adjacent weekends and holidays
  const beforeFirstDay = subDays(firstDay, 1);
  const afterLastDay = addDays(lastDay, 1);

  if (isWeekend(beforeFirstDay) || holidays.some((h) => isSameDay(h.date, beforeFirstDay))) {
    totalDays += getConsecutiveWeekendHolidayDays(beforeFirstDay, holidays, 'before');
  }

  if (isWeekend(afterLastDay) || holidays.some((h) => isSameDay(h.date, afterLastDay))) {
    totalDays += getConsecutiveWeekendHolidayDays(afterLastDay, holidays, 'after');
  }

  return totalDays;
}

function getConsecutiveWeekendHolidayDays(
  startDate: Date,
  holidays: HolidayDTO[],
  direction: 'before' | 'after'
): number {
  let count = 0;
  let current = new Date(startDate);

  while (true) {
    const isCurrentWeekend = isWeekend(current);
    const isCurrentHoliday = holidays.some((h) => isSameDay(h.date, current));

    if (!isCurrentWeekend && !isCurrentHoliday) {
      break;
    }

    if (!isCurrentWeekend) {
      count++;
    }

    current = direction === 'before' ? subDays(current, 1) : addDays(current, 1);
  }

  return count;
}
