import { resolveSelectedDays } from './selection';

interface MeasureBudgetParams {
  ptoDays: number;
  days?: Date[];
  manuallySelectedDays?: Date[];
  removedSuggestedDays?: Date[];
}

export interface BudgetMeasure {
  suggested: number;
  manual: number;
  spent: number;
  remaining: number;
}

export function measureBudget({
  ptoDays,
  days = [],
  manuallySelectedDays = [],
  removedSuggestedDays = [],
}: MeasureBudgetParams): BudgetMeasure {
  const manual = manuallySelectedDays.length;
  const spent = resolveSelectedDays({ days, manuallySelectedDays, removedSuggestedDays }).length;

  return {
    suggested: spent - manual,
    manual,
    spent,
    remaining: Math.max(0, ptoDays - spent),
  };
}
