import type { HolidayDTO } from '@application/dto/holiday/types';
import { Suggestion } from './types';
import { calculateTotalEffectiveDays } from './utils/calculateTotalEffectiveDays';
import { findOptimalDays } from './utils/findOptimalDays';
import { getAvailableWorkdays } from './utils/getWorkdays';

export interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
}

export function generateSuggestions(params: GenerateSuggestionsParams): Suggestion {
  const { ptoDays, holidays, allowPastDays, months } = params;

  if (ptoDays <= 0) {
    return { days: [], totalEffectiveDays: 0 };
  }

  // Get all available workdays
  const availableWorkdays = getAvailableWorkdays({
    months,
    holidays,
    allowPastDays,
  });

  // Find the optimal days using the block logic but returning just days
  const selectedDays = findOptimalDays({
    availableWorkdays,
    holidays,
    targetPtoDays: ptoDays,
  });

  // Calculate total effective days
  const totalEffectiveDays = calculateTotalEffectiveDays(selectedDays, holidays);

  return {
    days: selectedDays,
    totalEffectiveDays,
  };
}
