import { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, isWeekend } from 'date-fns';
import { PTO_CONSTANTS } from '../../const';
import { Suggestion } from '../../types';
import { GenerateAlternativesParams } from '../generateAlternatives';
import { calculateGroupedEffectiveDays, findSimilarSizeBlocks, selectAlternativeBridges } from './helpers';
import { getDateKey } from '@application/stores/utils/helpers';
import { getCombinationKey } from '../../utils/helpers';
import { findBridges } from '../../utils/finder';

export function generateBlockShifts(
  existingSuggestion: Date[],
  availableWorkdays: Date[],
  holidays: HolidayDTO[],
  usedCombinations: Set<string>
): Suggestion[] {
  const alternatives: Suggestion[] = [];
  const shifts = PTO_CONSTANTS.BLOCK_SHIFTS.WEEKLY_SHIFTS;

  for (const shift of shifts) {
    const shiftedDays = existingSuggestion.map((d) => addDays(d, shift));

    const allValid = shiftedDays.every((day) => availableWorkdays.some((wd) => wd.getTime() === day.getTime()));

    if (!allValid) continue;

    const key = getCombinationKey(shiftedDays);
    if (!usedCombinations.has(key)) {
      const totalEffectiveDays = calculateGroupedEffectiveDays(shiftedDays, holidays);
      const efficiency = totalEffectiveDays / shiftedDays.length;

      if (efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_ALTERNATIVES) {
        alternatives.push({
          days: shiftedDays.toSorted((a, b) => a.getTime() - b.getTime()),
          totalEffectiveDays,
          efficiency,
          strategy: 'grouped',
        });
        usedCombinations.add(key);
      }
    }
  }

  return alternatives;
}

export function generateBlockRotations(
  existingSuggestion: Date[],
  availableWorkdays: Date[],
  holidays: HolidayDTO[],
  usedCombinations: Set<string>,
  targetDays: number
): Suggestion[] {
  const alternatives: Suggestion[] = [];
  const sortedDays = [...existingSuggestion].sort((a, b) => a.getTime() - b.getTime());

  if (sortedDays.length === 0) return alternatives;

  for (let i = 1; i <= PTO_CONSTANTS.BLOCK_SHIFTS.MAX_ROTATION_DAYS && alternatives.length < 2; i++) {
    const newDays: Date[] = [];
    const usedDates = new Set<string>();

    const startDay = addDays(sortedDays[sortedDays.length - 1], i);

    let currentDay = startDay;
    let daysAdded = 0;

    while (daysAdded < targetDays && daysAdded < PTO_CONSTANTS.BLOCK_SHIFTS.MAX_DAYS_TO_ADD) {
      if (!isWeekend(currentDay)) {
        const isAvailable = availableWorkdays.some((wd) => wd.getTime() === currentDay.getTime());

        if (isAvailable && !usedDates.has(getDateKey(currentDay))) {
          newDays.push(new Date(currentDay));
          usedDates.add(getDateKey(currentDay));
          daysAdded++;
        }
      }

      currentDay = addDays(currentDay, 1);
    }

    if (newDays.length === targetDays) {
      const key = getCombinationKey(newDays);
      if (!usedCombinations.has(key)) {
        const totalEffectiveDays = calculateGroupedEffectiveDays(newDays, holidays);
        const efficiency = totalEffectiveDays / newDays.length;

        if (efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_ALTERNATIVES) {
          alternatives.push({
            days: newDays.toSorted((a, b) => a.getTime() - b.getTime()),
            totalEffectiveDays,
            efficiency,
            strategy: 'grouped',
          });
          usedCombinations.add(key);
        }
      }
    }
  }

  return alternatives;
}

export function generateGroupedAlternatives(
  params: GenerateAlternativesParams,
  availableWorkdays: Date[],
  effectiveHolidays: HolidayDTO[]
): Suggestion[] {
  const { ptoDays, existingSuggestion, maxAlternatives } = params;
  const alternatives: Suggestion[] = [];
  const usedCombinations = new Set<string>();

  usedCombinations.add(getCombinationKey(existingSuggestion));

  const shiftedAlternatives = generateBlockShifts(
    existingSuggestion,
    availableWorkdays,
    effectiveHolidays,
    usedCombinations
  );
  alternatives.push(...shiftedAlternatives);

  if (alternatives.length < maxAlternatives) {
    const rotatedAlternatives = generateBlockRotations(
      existingSuggestion,
      availableWorkdays,
      effectiveHolidays,
      usedCombinations,
      ptoDays
    );
    alternatives.push(...rotatedAlternatives);
  }

  if (alternatives.length < maxAlternatives) {
    const allBridges = findBridges(availableWorkdays, effectiveHolidays);
    const existingDaySet = new Set(existingSuggestion.map((d) => getDateKey(d)));

    const targetBlockSize = existingSuggestion.length;
    const similarBlocks = findSimilarSizeBlocks(allBridges, targetBlockSize, existingDaySet, usedCombinations);

    alternatives.push(...similarBlocks);
  }

  const valuableAlternatives = alternatives.filter(
    (alt) => alt.efficiency && alt.efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_ALTERNATIVES
  );

  return valuableAlternatives
    .toSorted((a, b) => {
      const effDiff = (b.efficiency || 0) - (a.efficiency || 0);
      if (Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) return effDiff;
      return b.totalEffectiveDays - a.totalEffectiveDays;
    })
    .slice(0, maxAlternatives);
}

export function generateOptimizedAlternatives(
  params: GenerateAlternativesParams,
  availableWorkdays: Date[],
  effectiveHolidays: HolidayDTO[]
): Suggestion[] {
  const { ptoDays, existingSuggestion, maxAlternatives } = params;
  const alternatives: Suggestion[] = [];
  const usedCombinations = new Set<string>();

  usedCombinations.add(getCombinationKey(existingSuggestion));

  const allBridges = findBridges(availableWorkdays, effectiveHolidays);
  const existingDaySet = new Set(existingSuggestion.map((d) => getDateKey(d)));
  const unusedBridges = allBridges.filter(
    (bridge) => !bridge.ptoDays.some((day) => existingDaySet.has(getDateKey(day)))
  );

  for (
    let skipFirst = 0;
    skipFirst < PTO_CONSTANTS.BRIDGE_GENERATION.MAX_SKIP_FIRST && alternatives.length < maxAlternatives;
    skipFirst++
  ) {
    const combination = selectAlternativeBridges(unusedBridges.slice(skipFirst), ptoDays, usedCombinations);

    if (combination.days.length === ptoDays) {
      alternatives.push({
        ...combination,
        strategy: 'optimized',
      });
      usedCombinations.add(getCombinationKey(combination.days));
    }
  }

  const valuableAlternatives = alternatives.filter(
    (alt) => alt.efficiency && alt.efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_OPTIMIZED
  );

  return valuableAlternatives
    .toSorted((a, b) => {
      const effDiff = (b.efficiency || 0) - (a.efficiency || 0);
      if (Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) return effDiff;
      return b.totalEffectiveDays - a.totalEffectiveDays;
    })
    .slice(0, maxAlternatives);
}

export function generateBalancedAlternatives(
  params: GenerateAlternativesParams,
  availableWorkdays: Date[],
  effectiveHolidays: HolidayDTO[]
): Suggestion[] {
  const { ptoDays, existingSuggestion, maxAlternatives } = params;
  const alternatives: Suggestion[] = [];
  const usedCombinations = new Set<string>();

  usedCombinations.add(getCombinationKey(existingSuggestion));

  const allBridges = findBridges(availableWorkdays, effectiveHolidays);

  const mediumBlocks = allBridges.filter(
    (b) =>
      b.ptoDaysNeeded >= 2 &&
      b.ptoDaysNeeded <= 3 &&
      b.efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_MEDIUM
  );

  const existingDaySet = new Set(existingSuggestion.map((d) => getDateKey(d)));

  for (const block of mediumBlocks.slice(0, PTO_CONSTANTS.BRIDGE_GENERATION.MAX_MEDIUM_BLOCKS)) {
    if (alternatives.length >= maxAlternatives) break;

    const hasConflict = block.ptoDays.some((day) => existingDaySet.has(getDateKey(day)));

    if (!hasConflict) {
      const days = [...block.ptoDays];
      let totalEffective = block.effectiveDays;

      if (days.length < ptoDays) {
        const singleDays = allBridges
          .filter(
            (b) =>
              b.ptoDaysNeeded === 1 &&
              b.efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_SINGLE &&
              !block.ptoDays.some((d) => d.getTime() === b.ptoDays[0].getTime())
          )
          .slice(0, ptoDays - days.length);

        for (const single of singleDays) {
          days.push(single.ptoDays[0]);
          totalEffective += single.effectiveDays;
        }
      }

      if (days.length === ptoDays) {
        const key = getCombinationKey(days);
        if (!usedCombinations.has(key)) {
          alternatives.push({
            days: days.toSorted((a, b) => a.getTime() - b.getTime()),
            totalEffectiveDays: totalEffective,
            efficiency: totalEffective / days.length,
            strategy: 'balanced',
          });
          usedCombinations.add(key);
        }
      }
    }
  }

  return alternatives.slice(0, maxAlternatives);
}
