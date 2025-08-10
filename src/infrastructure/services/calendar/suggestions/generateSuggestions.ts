import type { HolidayDTO } from '@application/dto/holiday/types';
import { generateBlockOpportunities } from './utils/generateBlockOpportunities';
import { getAvailableWorkdays } from './utils/getWorkdays';
import { selectOptimalBlocks } from './utils/selectOptimalBlocks';

export interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
}

export function generateSuggestions(params: GenerateSuggestionsParams) {
  const { ptoDays, holidays, allowPastDays, months } = params;

  if (ptoDays <= 0) {
    return { blocks: [] };
  }

  const availableWorkdays = getAvailableWorkdays({
    months,
    holidays,
    allowPastDays,
  });

  const opportunities = generateBlockOpportunities({
    availableWorkdays,
    holidays,
    maxBlockSize: Math.min(5, ptoDays),
  });

  const selectedBlocks = selectOptimalBlocks({
    opportunities,
    targetDays: ptoDays,
  });

  return {
    blocks: selectedBlocks,
  };
}
