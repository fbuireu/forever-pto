import { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, differenceInDays, isWeekend } from 'date-fns';
import { PTO_CONSTANTS } from '../const';
import { Bridge, Suggestion } from '../types';
import { createHolidaySet, getCombinationKey, getKey } from './cache';

export const deduplicateDays = (days: Date[]): Date[] => {
  const uniqueKeys = new Set<string>();
  const uniqueDays: Date[] = [];

  for (const day of days) {
    const key = getKey(day);
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      uniqueDays.push(day);
    }
  }

  return uniqueDays.sort((a, b) => a.getTime() - b.getTime());
};

export const createDateSet = (dates: Date[]): Set<string> => new Set(dates.map((date) => getKey(date)));

export const areSuggestionsEqual = (s1: Suggestion, s2: Suggestion): boolean => {
  if (s1.days.length !== s2.days.length) return false;

  const set1 = createDateSet(s1.days);
  const set2 = createDateSet(s2.days);

  for (const key of set1) {
    if (!set2.has(key)) return false;
  }
  return true;
};

export const filterDuplicateAlternatives = (alternatives: Suggestion[], mainSuggestion: Suggestion): Suggestion[] => {
  const usedKeys = new Set<string>();
  usedKeys.add(getCombinationKey(mainSuggestion.days));

  return alternatives.filter((alt) => {
    const key = getCombinationKey(alt.days);
    if (usedKeys.has(key)) return false;
    usedKeys.add(key);
    return true;
  });
};

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

  const holidaySet = createHolidaySet(holidays);
  const workdays: Date[] = [];

  for (const month of months) {
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);

      if (!allowPastDays && date.getTime() < todayTime) continue;
      if (isWeekend(date)) continue;
      if (holidaySet.has(getKey(date))) continue;

      workdays.push(date);
    }
  }

  return workdays;
}

export function isFreeDay(date: Date, holidaySet: Set<string>): boolean {
  return isWeekend(date) || holidaySet.has(getKey(date));
}

export const hasDateConflict = (newDays: Date[], existingDays: Set<string>): boolean => {
  return newDays.some((day) => existingDays.has(getKey(day)));
};

export const addDaysToSet = (days: Date[], targetSet: Set<string>): void => {
  for (const day of days) {
    targetSet.add(getKey(day));
  }
};

export const findBridges = (availableWorkdays: Date[], holidays: HolidayDTO[]): Bridge[] => {
  if (availableWorkdays.length === 0) return [];

  const holidaySet = createHolidaySet(holidays);
  const bridges: Bridge[] = [];

  const sortedWorkdays = [...availableWorkdays].sort((a, b) => a.getTime() - b.getTime());

  // Para cada día laborable, ver qué puente crearía
  for (const workday of sortedWorkdays) {
    // Intentar crear puente de 1 día
    const singleBridge = analyzePotentialBridge([workday], holidaySet);
    if (singleBridge) {
      bridges.push(singleBridge);
    }

    // Intentar crear puentes de 2-3 días consecutivos
    for (let size = 2; size <= 3; size++) {
      const multiDays: Date[] = [workday];

      for (let i = 1; i < size; i++) {
        const nextDay = addDays(workday, i);
        // Solo añadir si es día laborable disponible
        if (sortedWorkdays.some((d) => d.getTime() === nextDay.getTime())) {
          multiDays.push(nextDay);
        } else {
          break;
        }
      }

      if (multiDays.length === size) {
        const multiBridge = analyzePotentialBridge(multiDays, holidaySet);
        if (multiBridge) {
          bridges.push(multiBridge);
        }
      }
    }
  }

  // Eliminar duplicados y ordenar por eficiencia
  const uniqueBridges = deduplicateBridges(bridges);
  
  return uniqueBridges.sort((a, b) => {
    const effDiff = b.efficiency - a.efficiency;
    if (Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) {
      return effDiff;
    }
    return b.effectiveDays - a.effectiveDays;
  });
};

// Función para analizar si un conjunto de días crea un puente válido
function analyzePotentialBridge(ptoDays: Date[], holidaySet: Set<string>): Bridge | null {
  if (ptoDays.length === 0) return null;

  // Ordenar los días
  const sortedDays = [...ptoDays].sort((a, b) => a.getTime() - b.getTime());
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  // REGLA CLAVE: Al menos uno de los días debe estar ADYACENTE a un día libre
  let hasAdjacentFreeDay = false;

  for (const day of sortedDays) {
    const prevDay = addDays(day, -1);
    const nextDay = addDays(day, 1);

    const prevIsFree = isWeekend(prevDay) || holidaySet.has(getKey(prevDay));
    const nextIsFree = isWeekend(nextDay) || holidaySet.has(getKey(nextDay));

    if (prevIsFree || nextIsFree) {
      hasAdjacentFreeDay = true;
      break;
    }
  }

  // Si ningún día está adyacente a un día libre, NO es un puente válido
  if (!hasAdjacentFreeDay) {
    return null;
  }

  // Calcular el período efectivo total
  let effectiveStart = firstDay;
  let effectiveEnd = lastDay;

  // Expandir hacia atrás incluyendo días libres consecutivos
  let current = addDays(firstDay, -1);
  let expansionCount = 0;
  while ((isWeekend(current) || holidaySet.has(getKey(current))) && expansionCount < PTO_CONSTANTS.SAFETY_LIMIT) {
    effectiveStart = current;
    current = addDays(current, -1);
    expansionCount++;
  }

  // Expandir hacia adelante incluyendo días libres consecutivos
  current = addDays(lastDay, 1);
  expansionCount = 0;
  while ((isWeekend(current) || holidaySet.has(getKey(current))) && expansionCount < PTO_CONSTANTS.SAFETY_LIMIT) {
    effectiveEnd = current;
    current = addDays(current, 1);
    expansionCount++;
  }

  const effectiveDays = differenceInDays(effectiveEnd, effectiveStart) + 1;
  const efficiency = effectiveDays / ptoDays.length;

  // Solo crear puente si tiene eficiencia mínima
  if (efficiency >= PTO_CONSTANTS.EFFICIENCY.MINIMUM) {
    return {
      startDate: effectiveStart,
      endDate: effectiveEnd,
      ptoDaysNeeded: ptoDays.length,
      effectiveDays,
      efficiency,
      ptoDays: sortedDays,
      type: classifyBridgeType(efficiency),
    };
  }

  return null;
}

function deduplicateBridges(bridges: Bridge[]): Bridge[] {
  const seen = new Map<string, Bridge>();

  for (const bridge of bridges) {
    const key = bridge.ptoDays
      .map((d) => getKey(d))
      .sort()
      .join(',');
    const existing = seen.get(key);

    if (!existing || bridge.efficiency > existing.efficiency) {
      seen.set(key, bridge);
    }
  }

  return Array.from(seen.values());
}

function classifyBridgeType(efficiency: number): Bridge['type'] {
  if (efficiency >= PTO_CONSTANTS.EFFICIENCY.PERFECT) return 'perfect';
  if (efficiency >= PTO_CONSTANTS.EFFICIENCY.GOOD) return 'good';
  if (efficiency >= PTO_CONSTANTS.EFFICIENCY.ACCEPTABLE) return 'acceptable';
  return 'regular';
}
