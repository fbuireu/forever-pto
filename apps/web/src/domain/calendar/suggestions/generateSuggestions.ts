import type { FilterStrategy } from '../types';
import type { PlanningCandidates } from '../utils/candidates';
import { selectBridgesForStrategy } from './utils/selectors';

export interface GenerateSuggestionsParams {
  ptoDays: number;
  candidates: PlanningCandidates;
  strategy: FilterStrategy;
}

export function generateSuggestions({ ptoDays, candidates, strategy }: GenerateSuggestionsParams) {
  if (ptoDays <= 0) {
    return { days: [], strategy };
  }

  const { availableWorkdays, bridges } = candidates;

  if (availableWorkdays.length === 0) {
    return { days: [], strategy };
  }

  const effectivePtoDays = Math.min(availableWorkdays.length, ptoDays);

  const selection = selectBridgesForStrategy({ bridges, targetPtoDays: effectivePtoDays, strategy });

  return {
    days: selection.days.toSorted((a, b) => a.getTime() - b.getTime()),
    bridges: selection.bridges,
    strategy,
  };
}
