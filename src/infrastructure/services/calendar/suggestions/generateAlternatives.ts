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

  // Get all available workdays
  const availableWorkdays = getAvailableWorkdays({
    months,
    holidays,
    allowPastDays,
  });

  const alternatives: Suggestion[] = [];
  const usedCombinations = new Set<string>();

  // Add existing suggestion to used combinations
  const existingKey = existingSuggestion
    .map((d) => d.toISOString())
    .sort()
    .join(',');
  usedCombinations.add(existingKey);

  // Strategy 1: Remove some of the best days to force different combinations
  for (let skip = 1; skip <= maxAlternatives && alternatives.length < maxAlternatives; skip++) {
    const filteredWorkdays = availableWorkdays.filter((day, index) => {
      // Skip every nth best day to create variation
      if (index < skip * 2 && index % 2 === 0) {
        return false;
      }
      return true;
    });

    const alternativeDays = findOptimalDays({
      availableWorkdays: filteredWorkdays,
      holidays,
      targetPtoDays: ptoDays,
    });

    const key = alternativeDays
      .map((d) => d.toISOString())
      .sort()
      .join(',');

    if (!usedCombinations.has(key) && alternativeDays.length === ptoDays) {
      alternatives.push({
        days: alternativeDays,
        totalEffectiveDays: calculateTotalEffectiveDays(alternativeDays, holidays),
      });
      usedCombinations.add(key);
    }
  }

  // Strategy 2: Prioritize different months
  const monthGroups = new Map<number, Date[]>();
  availableWorkdays.forEach((day) => {
    const month = day.getMonth();
    if (!monthGroups.has(month)) {
      monthGroups.set(month, []);
    }
    monthGroups.get(month)!.push(day);
  });

  const sortedMonths = Array.from(monthGroups.keys()).sort((a, b) => {
    // Prioritize different months than the main suggestion
    const aCount = existingSuggestion.filter((d) => d.getMonth() === a).length;
    const bCount = existingSuggestion.filter((d) => d.getMonth() === b).length;
    return aCount - bCount;
  });

  for (const priorityMonth of sortedMonths) {
    if (alternatives.length >= maxAlternatives) break;

    // Create workdays list prioritizing this month
    const prioritizedWorkdays = [
      ...(monthGroups.get(priorityMonth) || []),
      ...availableWorkdays.filter((d) => d.getMonth() !== priorityMonth),
    ];

    const alternativeDays = findOptimalDays({
      availableWorkdays: prioritizedWorkdays,
      holidays,
      targetPtoDays: ptoDays,
    });

    const key = alternativeDays
      .map((d) => d.toISOString())
      .sort()
      .join(',');

    if (!usedCombinations.has(key) && alternativeDays.length === ptoDays) {
      alternatives.push({
        days: alternativeDays,
        totalEffectiveDays: calculateTotalEffectiveDays(alternativeDays, holidays),
      });
      usedCombinations.add(key);
    }
  }

  // Strategy 3: Force smaller sequences (more scattered days)
  if (alternatives.length < maxAlternatives) {
    const scatteredDays = findScatteredOptimalDays({
      availableWorkdays,
      holidays,
      targetPtoDays: ptoDays,
      maxSequenceSize: 2, // Force smaller sequences
    });

    const key = scatteredDays
      .map((d) => d.toISOString())
      .sort()
      .join(',');

    if (!usedCombinations.has(key) && scatteredDays.length === ptoDays) {
      alternatives.push({
        days: scatteredDays,
        totalEffectiveDays: calculateTotalEffectiveDays(scatteredDays, holidays),
      });
    }
  }

  // Sort alternatives by effective days (descending) but they should be less than main suggestion
  return alternatives.sort((a, b) => b.totalEffectiveDays - a.totalEffectiveDays);
}

// Helper function for scattered days strategy
function findScatteredOptimalDays({
  availableWorkdays,
  holidays,
  targetPtoDays,
  maxSequenceSize,
}: {
  availableWorkdays: Date[];
  holidays: HolidayDTO[];
  targetPtoDays: number;
  maxSequenceSize: number;
}): Date[] {
  // This is similar to findOptimalDays but with a smaller max sequence size
  // to force more scattered vacation days
  const modifiedFindOptimalDays = findOptimalDays({
    availableWorkdays,
    holidays,
    targetPtoDays,
  });

  // For now, return the standard result
  // In a real implementation, you'd modify findOptimalDays to accept maxSequenceSize
  return modifiedFindOptimalDays;
}
