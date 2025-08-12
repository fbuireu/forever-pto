import type { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, differenceInDays, isSameDay, isWeekend, subDays } from 'date-fns';

interface DaySequence {
  days: Date[];
  effectiveDays: number;
  efficiency: number;
  score: number;
}

export function findOptimalDays({
  availableWorkdays,
  holidays,
  targetPtoDays,
}: {
  availableWorkdays: Date[];
  holidays: HolidayDTO[];
  targetPtoDays: number;
}): Date[] {
  // Generate all possible sequences of consecutive days (up to 5 days per sequence)
  const sequences = generateDaySequences(availableWorkdays, holidays, Math.min(5, targetPtoDays));

  // Sort by score (best first)
  sequences.sort((a, b) => b.score - a.score);

  // Select the best sequences that sum to targetPtoDays
  const selectedDays: Date[] = [];
  const usedDays = new Set<string>();

  for (const sequence of sequences) {
    if (selectedDays.length >= targetPtoDays) break;

    // Check if any day in this sequence is already used
    const hasConflict = sequence.days.some((day) => usedDays.has(day.toISOString()));
    if (hasConflict) continue;

    // Check if adding this sequence would exceed target
    if (selectedDays.length + sequence.days.length > targetPtoDays) {
      // Try to take partial sequence if it helps reach exact target
      const remainingDays = targetPtoDays - selectedDays.length;
      if (remainingDays > 0) {
        const partialDays = sequence.days.slice(0, remainingDays);
        partialDays.forEach((day) => {
          selectedDays.push(day);
          usedDays.add(day.toISOString());
        });
      }
    } else {
      // Add all days from this sequence
      sequence.days.forEach((day) => {
        selectedDays.push(day);
        usedDays.add(day.toISOString());
      });
    }
  }

  // If we haven't reached target, fill with remaining best individual days
  if (selectedDays.length < targetPtoDays) {
    const remainingWorkdays = availableWorkdays
      .filter((day) => !usedDays.has(day.toISOString()))
      .map((day) => ({
        day,
        score: calculateSingleDayScore(day, holidays),
      }))
      .sort((a, b) => b.score - a.score);

    for (const { day } of remainingWorkdays) {
      if (selectedDays.length >= targetPtoDays) break;
      selectedDays.push(day);
    }
  }

  return selectedDays;
}

function generateDaySequences(workdays: Date[], holidays: HolidayDTO[], maxSequenceSize: number): DaySequence[] {
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
          const daysBetween = differenceInDays(currentDay, prevDay);

          // If days are more than 4 days apart, not a good sequence
          if (daysBetween > 4) {
            isValidSequence = false;
            break;
          }
        }

        sequenceDays.push(currentDay);
      }

      if (isValidSequence && sequenceDays.length > 0) {
        const effectiveDays = calculateEffectiveDays(sequenceDays, holidays);
        const efficiency = effectiveDays / sequenceDays.length;
        const score = calculateSequenceScore(sequenceDays, effectiveDays, efficiency, holidays);

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

function calculateEffectiveDays(days: Date[], holidays: HolidayDTO[]): number {
  if (days.length === 0) return 0;

  const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  // Base effective days is the span from first to last day
  let effectiveDays = differenceInDays(lastDay, firstDay) + 1;

  const isHoliday = (date: Date) => holidays.some((h) => isSameDay(new Date(h.date), date));
  const isFreeDay = (date: Date) => isWeekend(date) || isHoliday(date);

  // Add free days before the sequence
  let before = subDays(firstDay, 1);
  while (isFreeDay(before)) {
    effectiveDays++;
    before = subDays(before, 1);
  }

  // Add free days after the sequence
  let after = addDays(lastDay, 1);
  while (isFreeDay(after)) {
    effectiveDays++;
    after = addDays(after, 1);
  }

  return effectiveDays;
}

function calculateSequenceScore(
  days: Date[],
  effectiveDays: number,
  efficiency: number,
  holidays: HolidayDTO[]
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
  const isHoliday = (date: Date) => holidays.some((h) => isSameDay(new Date(h.date), date));

  if (isHoliday(subDays(firstDay, 1)) || isHoliday(addDays(lastDay, 1))) {
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

function calculateSingleDayScore(day: Date, holidays: HolidayDTO[]): number {
  let score = 1;
  const dayOfWeek = day.getDay();

  // Prefer Mondays and Fridays
  if (dayOfWeek === 1 || dayOfWeek === 5) {
    score += 3;
  }

  // Check proximity to holidays
  const isHoliday = (date: Date) => holidays.some((h) => isSameDay(new Date(h.date), date));

  if (isHoliday(subDays(day, 1)) || isHoliday(addDays(day, 1))) {
    score += 4;
  }

  // Check if creates a bridge
  if (
    (isWeekend(subDays(day, 1)) || isHoliday(subDays(day, 1))) &&
    (isWeekend(addDays(day, 1)) || isHoliday(addDays(day, 1)))
  ) {
    score += 5;
  }

  return score;
}
