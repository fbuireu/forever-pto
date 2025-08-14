import { ALTERNATIVE_CONSTANTS } from '../const';

export function calculateDayScoreOptimized(day: Date, holidaySet: Set<string>): number {
  let score = ALTERNATIVE_CONSTANTS.SCORING.BASE_SCORE;
  const dayOfWeek = day.getDay();

  if (dayOfWeek === ALTERNATIVE_CONSTANTS.DAYS.MONDAY || dayOfWeek === ALTERNATIVE_CONSTANTS.DAYS.FRIDAY) {
    score += ALTERNATIVE_CONSTANTS.SCORING.MONDAY_FRIDAY_BONUS;
  }

  const year = day.getFullYear();
  const month = day.getMonth();
  const date = day.getDate();

  const beforeKey = `${year}-${month}-${date - 1}`;
  const afterKey = `${year}-${month}-${date + 1}`;

  if (holidaySet.has(beforeKey) || holidaySet.has(afterKey)) {
    score += ALTERNATIVE_CONSTANTS.SCORING.HOLIDAY_ADJACENT_BONUS;
  }

  if (dayOfWeek === ALTERNATIVE_CONSTANTS.DAYS.MONDAY && holidaySet.has(beforeKey)) {
    score += ALTERNATIVE_CONSTANTS.SCORING.LONG_WEEKEND_BONUS;
  }
  if (dayOfWeek === ALTERNATIVE_CONSTANTS.DAYS.FRIDAY && holidaySet.has(afterKey)) {
    score += ALTERNATIVE_CONSTANTS.SCORING.LONG_WEEKEND_BONUS;
  }

  return score;
}
