import type { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, isSameMonth, isSameYear } from 'date-fns';
import type { Suggestion } from '../suggestions/types';
import { calculateTotalEffectiveDays } from '../suggestions/utils/calculators';
import { getAvailableWorkdays } from '../suggestions/utils/helpers';
import { ALTERNATIVE_CONSTANTS } from './const';
import { createHolidaySet, getCombinationKey } from './utils/helpers';

export interface GenerateAlternativesParams {
  year: number;
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
  maxAlternatives: number;
  existingSuggestion: Date[];
}

export function generateAlternatives(params: GenerateAlternativesParams): Suggestion[] {
  const { ptoDays, holidays, allowPastDays, months, maxAlternatives, existingSuggestion } = params;

  if (ptoDays <= 0 || maxAlternatives <= 0 || existingSuggestion.length === 0) {
    return [];
  }

  const alternatives: Suggestion[] = [];
  const usedCombinations = new Set<string>();
  const holidaySet = createHolidaySet(holidays);

  // Add existing suggestion to used combinations
  usedCombinations.add(getCombinationKey(existingSuggestion));
  const mainEffectiveDays = calculateTotalEffectiveDays(existingSuggestion, holidays);

  // Generate alternatives by shifting the existing suggestion
  for (let shiftDays = -21; shiftDays <= 21; shiftDays += 7) {
    if (shiftDays === 0 || alternatives.length >= maxAlternatives) continue;

    const shiftedDays = existingSuggestion.map((day) => addDays(day, shiftDays));

    // Verify dates are within available months
    const isValidRange = shiftedDays.every((day) =>
      months.some((month) => isSameMonth(day, month) && isSameYear(day, month))
    );

    if (!isValidRange) continue;

    // Check if all shifted days are available workdays
    const availableWorkdays = getAvailableWorkdays({ months, holidays, allowPastDays });
    const areAllWorkdays = shiftedDays.every((shiftedDay) =>
      availableWorkdays.some((workday) => workday.getTime() === shiftedDay.getTime())
    );

    if (!areAllWorkdays) continue;

    const key = getCombinationKey(shiftedDays);
    if (usedCombinations.has(key)) continue;

    const effectiveDays = calculateTotalEffectiveDays(shiftedDays, holidays);

    // Only include alternatives that are reasonably good
    if (effectiveDays >= ptoDays) {
      alternatives.push({
        days: shiftedDays,
        totalEffectiveDays: effectiveDays,
      });
      usedCombinations.add(key);
    }
  }

  // Generate a few more alternatives by trying different combinations
  if (alternatives.length < maxAlternatives && ptoDays <= ALTERNATIVE_CONSTANTS.FEW_DAYS_THRESHOLD) {
    const availableWorkdays = getAvailableWorkdays({ months, holidays, allowPastDays });
    const scoredDays = availableWorkdays
      .map((day) => ({
        day,
        score: calculateDayScore(day, holidaySet),
      }))
      .sort((a, b) => b.score - a.score);

    // Try different top combinations
    for (
      let startIdx = 0;
      startIdx < Math.min(scoredDays.length - ptoDays, 10) && alternatives.length < maxAlternatives;
      startIdx++
    ) {
      const candidateDays = scoredDays.slice(startIdx, startIdx + ptoDays).map((item) => item.day);
      const key = getCombinationKey(candidateDays);

      if (!usedCombinations.has(key)) {
        const effectiveDays = calculateTotalEffectiveDays(candidateDays, holidays);

        if (effectiveDays >= ptoDays) {
          alternatives.push({
            days: candidateDays.sort((a, b) => a.getTime() - b.getTime()),
            totalEffectiveDays: effectiveDays,
          });
          usedCombinations.add(key);
        }
      }
    }
  }

  return alternatives.sort((a, b) => b.totalEffectiveDays - a.totalEffectiveDays).slice(0, maxAlternatives);
}

function calculateDayScore(day: Date, holidaySet: Set<string>): number {
  let score = 1;
  const dayOfWeek = day.getDay();

  // Monday and Friday bonus
  if (dayOfWeek === 1 || dayOfWeek === 5) {
    score += ALTERNATIVE_CONSTANTS.SCORING.MONDAY_FRIDAY_BONUS;
  }

  // Check for adjacent holidays
  const prevDay = addDays(day, -1);
  const nextDay = addDays(day, 1);
  const prevKey = `${prevDay.getFullYear()}-${prevDay.getMonth()}-${prevDay.getDate()}`;
  const nextKey = `${nextDay.getFullYear()}-${nextDay.getMonth()}-${nextDay.getDate()}`;

  if (holidaySet.has(prevKey) || holidaySet.has(nextKey)) {
    score += ALTERNATIVE_CONSTANTS.SCORING.HOLIDAY_ADJACENT_BONUS;

    // Extended weekend bonus
    if ((dayOfWeek === 1 && holidaySet.has(prevKey)) || (dayOfWeek === 5 && holidaySet.has(nextKey))) {
      score += ALTERNATIVE_CONSTANTS.SCORING.LONG_WEEKEND_BONUS;
    }
  }

  return score;
}
