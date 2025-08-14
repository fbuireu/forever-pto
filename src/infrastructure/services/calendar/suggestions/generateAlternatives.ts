import type { HolidayDTO } from '@application/dto/holiday/types';
import type { Suggestion } from './types';
import { calculateTotalEffectiveDays } from './utils/calculateTotalEffectiveDays';
import { findOptimalDays } from './utils/findOptimalDays';
import { getAvailableWorkdays } from './utils/getWorkdays';

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

  if (ptoDays <= 0 || maxAlternatives <= 0) {
    return [];
  }

  const holidaySet = createHolidaySet(holidays);

  const availableWorkdays = getAvailableWorkdays({
    months,
    holidays,
    allowPastDays,
  });

  if (availableWorkdays.length < ptoDays) {
    return [];
  }

  const mainEffectiveDays = calculateTotalEffectiveDays(existingSuggestion, holidays);

  const usedCombinations = new Set<string>();
  
  const getCombinationKey = (days: Date[]) => {
    return days
      .map((d) => d.getTime())
      .sort((a, b) => a - b)
      .join(',');
  };

  // Add existing suggestion to used combinations
  usedCombinations.add(getCombinationKey(existingSuggestion));

  const alternatives: Suggestion[] = [];

  // Strategy based on PTO days count
  if (ptoDays <= 5) {
    // For few PTO days: explore more combinations systematically
    generateFewDaysAlternatives();
  } else {
    // For many PTO days: use parameter variations
    generateManyDaysAlternatives();
  }

  // Helper function for few PTO days (1-5)
  function generateFewDaysAlternatives() {
    // Create a scoring map for all workdays (cache scores)
    const scoredWorkdays = availableWorkdays.map((day) => ({
      day,
      score: calculateDayScoreOptimized(day, holidaySet),
      timestamp: day.getTime(),
    }));

    // Sort by score descending
    scoredWorkdays.sort((a, b) => b.score - a.score);

    // Take top candidates (limit to reduce combinations)
    const candidateCount = Math.min(scoredWorkdays.length, ptoDays * 4);
    const topCandidates = scoredWorkdays.slice(0, candidateCount);

    // Create set of main suggestion timestamps for O(1) lookup
    const mainDayTimestamps = new Set(existingSuggestion.map((d) => d.getTime()));

    // Try different combinations by progressively excluding days
    for (let excludeIdx = 0; excludeIdx < candidateCount && alternatives.length < maxAlternatives; excludeIdx++) {
      const filteredCandidates = topCandidates.filter(({ timestamp }, idx) => {
        // Skip some days to create variation
        if (idx === excludeIdx || (mainDayTimestamps.has(timestamp) && idx < Math.ceil(ptoDays / 3))) {
          return false;
        }
        return true;
      });

      // Get the best days from filtered list
      const selectedDays = filteredCandidates.slice(0, ptoDays).map((item) => item.day);

      if (selectedDays.length === ptoDays) {
        addAlternativeIfValid(selectedDays);
      }
    }
  }

  // Helper function for many PTO days (6+)
  function generateManyDaysAlternatives() {
    const variations = [
      { maxSequenceSize: 2 }, // Force scattered vacation
      { maxSequenceSize: 7 }, // Allow longer sequences
      { excludeMonths: getTopMonths(existingSuggestion, 1) }, // Exclude most used month
      { preferExtendedWeekends: true }, // Prioritize Friday/Monday
      { shiftDays: 7 }, // Shift pattern by a week
    ];

    for (let i = 0; i < variations.length && alternatives.length < maxAlternatives; i++) {
      const variation = variations[i];

      // Filter or modify workdays based on variation
      let modifiedWorkdays = [...availableWorkdays];

      if (variation.excludeMonths) {
        modifiedWorkdays = modifiedWorkdays.filter((day) => !variation.excludeMonths!.includes(day.getMonth()));
      }

      if (variation.preferExtendedWeekends) {
        // Sort to prioritize Monday (1) and Friday (5)
        modifiedWorkdays.sort((a, b) => {
          const aScore = a.getDay() === 1 || a.getDay() === 5 ? 10 : 1;
          const bScore = b.getDay() === 1 || b.getDay() === 5 ? 10 : 1;
          return bScore - aScore;
        });
      }

      if (variation.shiftDays) {
        // Rotate the array to start from a different point
        const shift = variation.shiftDays % modifiedWorkdays.length;
        modifiedWorkdays = [...modifiedWorkdays.slice(shift), ...modifiedWorkdays.slice(0, shift)];
      }

      // Generate alternative with variation
      const alternativeDays = findOptimalDays({
        availableWorkdays: modifiedWorkdays,
        holidays,
        targetPtoDays: ptoDays,
        maxSequenceSize: variation.maxSequenceSize,
      });

      if (alternativeDays.length === ptoDays) {
        addAlternativeIfValid(alternativeDays);
      }
    }

    // If still need more alternatives, try random sampling
    while (alternatives.length < maxAlternatives) {
      const shuffled = [...availableWorkdays].sort(() => Math.random() - 0.5);
      const randomDays = findOptimalDays({
        availableWorkdays: shuffled.slice(0, Math.min(ptoDays * 3, shuffled.length)),
        holidays,
        targetPtoDays: ptoDays,
        maxSequenceSize: Math.random() > 0.5 ? 3 : 5,
      });

      if (randomDays.length === ptoDays) {
        addAlternativeIfValid(randomDays);
      } else {
        break; // No more valid combinations found
      }
    }
  }

  // Helper to add alternative if valid
  function addAlternativeIfValid(days: Date[]) {
    const key = getCombinationKey(days);

    // Check if already used
    if (usedCombinations.has(key)) return;

    // Calculate effective days
    const effectiveDays = calculateTotalEffectiveDays(days, holidays);

    // IMPORTANT: Alternative should not be better than main suggestion
    if (effectiveDays > mainEffectiveDays) return;

    alternatives.push({
      days,
      totalEffectiveDays: effectiveDays,
    });

    usedCombinations.add(key);
  }

  // Sort by effective days (best alternatives first, but all <= main suggestion)
  return alternatives.sort((a, b) => b.totalEffectiveDays - a.totalEffectiveDays).slice(0, maxAlternatives);
}

// Create optimized holiday lookup structure
function createHolidaySet(holidays: HolidayDTO[]): Set<string> {
  const holidaySet = new Set<string>();
  for (const holiday of holidays) {
    const date = new Date(holiday.date);
    // Create YYYY-MM-DD key for O(1) lookup
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    holidaySet.add(key);
  }
  return holidaySet;
}

// Optimized day scoring function
function calculateDayScoreOptimized(day: Date, holidaySet: Set<string>): number {
  let score = 1;
  const dayOfWeek = day.getDay();

  // Prefer Monday/Friday
  if (dayOfWeek === 1 || dayOfWeek === 5) score += 2;

  // Check adjacent to holidays using optimized lookup
  const year = day.getFullYear();
  const month = day.getMonth();
  const date = day.getDate();

  const beforeKey = `${year}-${month}-${date - 1}`;
  const afterKey = `${year}-${month}-${date + 1}`;

  if (holidaySet.has(beforeKey) || holidaySet.has(afterKey)) {
    score += 3; // Adjacent to holiday
  }

  // Extra bonus for creating long weekends
  if (dayOfWeek === 1 && holidaySet.has(beforeKey)) score += 2; // Monday after holiday weekend
  if (dayOfWeek === 5 && holidaySet.has(afterKey)) score += 2; // Friday before holiday weekend

  return score;
}

// Get months with most days in the suggestion
function getTopMonths(days: Date[], count: number): number[] {
  const monthCounts = new Map<number, number>();

  for (const day of days) {
    const month = day.getMonth();
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  }

  return Array.from(monthCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([month]) => month);
}
