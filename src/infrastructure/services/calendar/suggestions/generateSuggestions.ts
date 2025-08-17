import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';
import type { OptimizationStrategy, Suggestion } from '../types';
import { findBridges } from '../utils/finder';
import { getAvailableWorkdays, getDateKey } from '../utils/helpers';
import { selectDaysByStrategy } from './utils/generators';
import { selectOptimalBridges } from './utils/helpers';

export interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
  strategy: OptimizationStrategy;
}

export function generateSuggestions(params: GenerateSuggestionsParams): Suggestion {
  const { ptoDays, holidays, allowPastDays, months, strategy = 'grouped' } = params;

  if (ptoDays <= 0) {
    return { days: [], totalEffectiveDays: 0 };
  }

  const effectiveHolidays = holidays.filter((h) => {
    const date = new Date(h.date);
    return !isWeekend(date);
  });

  const availableWorkdays = getAvailableWorkdays({
    months,
    holidays: effectiveHolidays,
    allowPastDays,
  });

  if (availableWorkdays.length < ptoDays) {
    return { days: [], totalEffectiveDays: 0 };
  }

  const bridges = findBridges(availableWorkdays, effectiveHolidays);

  const selectedBridges = selectOptimalBridges(bridges, ptoDays);

  const selectedDays = selectDaysByStrategy(bridges, ptoDays, strategy, availableWorkdays, effectiveHolidays);
  
  const selectedDaysSet = new Set<string>();
  const selectedDaysArray: Date[] = [];
  let totalEffectiveDays = 0;

  for (const bridge of selectedBridges) {
    for (const day of bridge.ptoDays) {
      const dayKey = getDateKey(day);
      if (!selectedDaysSet.has(dayKey)) {
        selectedDaysArray.push(day);
        selectedDaysSet.add(dayKey);
      }
    }
    totalEffectiveDays += bridge.effectiveDays;
  }

  if (selectedDaysArray.length < ptoDays) {
    const remainingDays = ptoDays - selectedDaysArray.length;

    const valuableBridges = bridges
      .filter((b) => b.ptoDaysNeeded === 1 && b.efficiency >= 3 && !selectedDaysSet.has(getDateKey(b.ptoDays[0])))
      .slice(0, remainingDays);

    for (const bridge of valuableBridges) {
      const dayKey = getDateKey(bridge.ptoDays[0]);
      if (!selectedDaysSet.has(dayKey)) {
        selectedDaysArray.push(bridge.ptoDays[0]);
        totalEffectiveDays += bridge.effectiveDays;
        selectedBridges.push(bridge);
        selectedDaysSet.add(dayKey);
      }
    }
  }

  selectedDaysArray.sort((a, b) => a.getTime() - b.getTime());

  return {
    days: selectedDaysArray,
    totalEffectiveDays,
    efficiency: selectedDaysArray.length > 0 ? totalEffectiveDays / selectedDaysArray.length : 0,
    bridges: selectedBridges,
    strategy
  };
}
