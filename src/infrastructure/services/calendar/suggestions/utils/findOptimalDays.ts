// @infrastructure/services/calendar/suggestions/utils/findOptimalDays.ts

import type { HolidayDTO } from '@application/dto/holiday/types';

interface DaySequence {
  days: Date[];
  effectiveDays: number;
  efficiency: number;
  score: number;
}

// Cache global para scores de días individuales
const dayScoreCache = new Map<string, number>();

// Cache para holiday sets
const holidaySetCache = new WeakMap<HolidayDTO[], Set<string>>();

export function findOptimalDays({
  availableWorkdays,
  holidays,
  targetPtoDays,
  maxSequenceSize,
}: {
  availableWorkdays: Date[];
  holidays: HolidayDTO[];
  targetPtoDays: number;
  maxSequenceSize?: number;
}): Date[] {
  // Create or get cached holiday set for O(1) lookups
  let holidaySet = holidaySetCache.get(holidays);
  if (!holidaySet) {
    holidaySet = createHolidaySet(holidays);
    holidaySetCache.set(holidays, holidaySet);
  }

  // Generate all possible sequences of consecutive days (up to 5 days per sequence by default)
  const maxSize = maxSequenceSize ?? Math.min(5, targetPtoDays);
  const sequences = generateDaySequences(availableWorkdays, holidaySet, maxSize);

  // Sort by score (best first)
  sequences.sort((a, b) => b.score - a.score);

  // Select the best sequences that sum to targetPtoDays
  const selectedDays: Date[] = [];
  const usedDaysSet = new Set<number>(); // Use timestamps for faster lookups

  for (const sequence of sequences) {
    if (selectedDays.length >= targetPtoDays) break;

    // Check if any day in this sequence is already used
    const hasConflict = sequence.days.some((day) => usedDaysSet.has(day.getTime()));
    if (hasConflict) continue;

    // Check if adding this sequence would exceed target
    if (selectedDays.length + sequence.days.length > targetPtoDays) {
      // Try to take partial sequence if it helps reach exact target
      const remainingDays = targetPtoDays - selectedDays.length;
      if (remainingDays > 0) {
        const partialDays = sequence.days.slice(0, remainingDays);
        partialDays.forEach((day) => {
          selectedDays.push(day);
          usedDaysSet.add(day.getTime());
        });
      }
    } else {
      // Add all days from this sequence
      sequence.days.forEach((day) => {
        selectedDays.push(day);
        usedDaysSet.add(day.getTime());
      });
    }
  }

  // If we haven't reached target, fill with remaining best individual days
  if (selectedDays.length < targetPtoDays) {
    const remainingWorkdays = availableWorkdays
      .filter((day) => !usedDaysSet.has(day.getTime()))
      .map((day) => ({
        day,
        score: getCachedSingleDayScore(day, holidaySet),
      }))
      .sort((a, b) => b.score - a.score);

    for (const { day } of remainingWorkdays) {
      if (selectedDays.length >= targetPtoDays) break;
      selectedDays.push(day);
    }
  }

  return selectedDays;
}

function generateDaySequences(workdays: Date[], holidaySet: Set<string>, maxSequenceSize: number): DaySequence[] {
  const sequences: DaySequence[] = [];

  for (let i = 0; i < workdays.length; i++) {
    for (let size = 1; size <= maxSequenceSize && i + size <= workdays.length; size++) {
      const sequenceDays: Date[] = [];
      let isValidSequence = true;

      // Check if days form a reasonable sequence (not too far apart)
      for (let j = 0; j < size; j++) {
        const currentDay = workdays[i + j];

        if (j > 0) {
          const prevDay = sequenceDays[j - 1];
          // Use timestamps for faster calculation
          const daysBetween = Math.floor((currentDay.getTime() - prevDay.getTime()) / 86400000);

          // If days are more than 4 days apart, not a good sequence
          if (daysBetween > 4) {
            isValidSequence = false;
            break;
          }
        }

        sequenceDays.push(currentDay);
      }

      if (isValidSequence && sequenceDays.length > 0) {
        const effectiveDays = calculateEffectiveDays(sequenceDays, holidaySet);
        const efficiency = effectiveDays / sequenceDays.length;
        const score = calculateSequenceScore(sequenceDays, effectiveDays, efficiency, holidaySet);

        sequences.push({
          days: sequenceDays,
          effectiveDays,
          efficiency,
          score,
        });
      }
    }
  }

  return sequences;
}

function calculateEffectiveDays(days: Date[], holidaySet: Set<string>): number {
  if (days.length === 0) return 0;

  const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  // Base effective days is the span from first to last day
  let effectiveDays = Math.floor((lastDay.getTime() - firstDay.getTime()) / 86400000) + 1;

  // Add free days before the sequence
  let before = new Date(firstDay);
  before.setDate(before.getDate() - 1);
  let beforeCount = 0;
  while (isFreeDay(before, holidaySet) && beforeCount < 30) {
    // Safety limit
    effectiveDays++;
    beforeCount++;
    before.setDate(before.getDate() - 1);
  }

  // Add free days after the sequence
  let after = new Date(lastDay);
  after.setDate(after.getDate() + 1);
  let afterCount = 0;
  while (isFreeDay(after, holidaySet) && afterCount < 30) {
    // Safety limit
    effectiveDays++;
    afterCount++;
    after.setDate(after.getDate() + 1);
  }

  return effectiveDays;
}

function calculateSequenceScore(
  days: Date[],
  effectiveDays: number,
  efficiency: number,
  holidaySet: Set<string>
): number {
  const ptoDays = days.length;

  // Base score is efficiency * 10
  let score = efficiency * 10;

  // Bonus for longer sequences (better than scattered single days)
  if (ptoDays >= 5) {
    score *= 1.5;
  } else if (ptoDays >= 3) {
    score *= 1.2;
  }

  // Check if adjacent to holidays
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const beforeKey = getDateKey(new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - 1));
  const afterKey = getDateKey(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1));

  if (holidaySet.has(beforeKey) || holidaySet.has(afterKey)) {
    score *= 1.3; // Bonus for being next to holidays
  }

  // Bonus for creating long bridges (9+ effective days)
  if (effectiveDays >= 9) {
    score *= 1.4;
  } else if (effectiveDays >= 7) {
    score *= 1.2;
  }

  // Penalty for single days with low efficiency
  if (ptoDays === 1 && efficiency < 3) {
    score *= 0.7;
  }

  return score;
}

function getCachedSingleDayScore(day: Date, holidaySet: Set<string>): number {
  const cacheKey = day.toISOString();

  if (dayScoreCache.has(cacheKey)) {
    return dayScoreCache.get(cacheKey)!;
  }

  const score = calculateSingleDayScore(day, holidaySet);
  dayScoreCache.set(cacheKey, score);

  // Limit cache size to prevent memory issues
  if (dayScoreCache.size > 1000) {
    // Clear oldest entries (simple FIFO)
    const firstKey = dayScoreCache.keys().next().value;
    dayScoreCache.delete(firstKey);
  }

  return score;
}

function calculateSingleDayScore(day: Date, holidaySet: Set<string>): number {
  let score = 1;
  const dayOfWeek = day.getDay();

  // Prefer Mondays and Fridays
  if (dayOfWeek === 1 || dayOfWeek === 5) {
    score += 3;
  }

  const year = day.getFullYear();
  const month = day.getMonth();
  const date = day.getDate();

  // Check proximity to holidays (O(1) lookup)
  const beforeKey = getDateKey(new Date(year, month, date - 1));
  const afterKey = getDateKey(new Date(year, month, date + 1));

  if (holidaySet.has(beforeKey) || holidaySet.has(afterKey)) {
    score += 4;
  }

  // Check if creates a bridge
  const before = new Date(year, month, date - 1);
  const after = new Date(year, month, date + 1);
  const beforeDayOfWeek = before.getDay();
  const afterDayOfWeek = after.getDay();

  const isBeforeFree = beforeDayOfWeek === 0 || beforeDayOfWeek === 6 || holidaySet.has(beforeKey);
  const isAfterFree = afterDayOfWeek === 0 || afterDayOfWeek === 6 || holidaySet.has(afterKey);

  if (isBeforeFree && isAfterFree) {
    score += 5; // Creates a bridge
  }

  return score;
}

// Helper function to create holiday set for O(1) lookups
function createHolidaySet(holidays: HolidayDTO[]): Set<string> {
  const holidaySet = new Set<string>();
  for (const holiday of holidays) {
    const date = new Date(holiday.date);
    holidaySet.add(getDateKey(date));
  }
  return holidaySet;
}

// Helper function to generate date key for set lookups
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Helper function to check if a day is free (weekend or holiday)
function isFreeDay(date: Date, holidaySet: Set<string>): boolean {
  const dayOfWeek = date.getDay();
  // Weekend check (0 = Sunday, 6 = Saturday)
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;

  // Holiday check using O(1) set lookup
  return holidaySet.has(getDateKey(date));
}
