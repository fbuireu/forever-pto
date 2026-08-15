import type { Bridge } from '../types';
import { FilterStrategy } from '../types';
import type { PlanningCandidates } from '../utils/candidates';
import { selectBridgesForStrategy, selectOptimalDaysFromBridges } from './utils/selectors';

export interface GenerateSuggestionsParams {
  ptoDays: number;
  candidates: PlanningCandidates;
  strategy: FilterStrategy;
}

const selectGroupedStrategy = (bridges: Bridge[], ptoDays: number) =>
  selectBridgesForStrategy({ bridges, targetPtoDays: ptoDays, strategy: FilterStrategy.GROUPED });

const selectOptimizedStrategy = (bridges: Bridge[], ptoDays: number) =>
  selectBridgesForStrategy({ bridges, targetPtoDays: ptoDays, strategy: FilterStrategy.OPTIMIZED });

const selectBalancedStrategy = (bridges: Bridge[], ptoDays: number) =>
  selectOptimalDaysFromBridges({ bridges, targetPtoDays: ptoDays });

const DEFAULT_STRATEGY = selectGroupedStrategy;

const STRATEGY_MAP = {
  [FilterStrategy.BALANCED]: selectBalancedStrategy,
  [FilterStrategy.GROUPED]: selectGroupedStrategy,
  [FilterStrategy.OPTIMIZED]: selectOptimizedStrategy,
} as const;

export function generateSuggestions({ ptoDays, candidates, strategy }: GenerateSuggestionsParams) {
  if (ptoDays <= 0) {
    return { days: [], strategy };
  }

  const { availableWorkdays, bridges } = candidates;

  if (availableWorkdays.length === 0) {
    return { days: [], strategy };
  }

  const effectivePtoDays = Math.min(availableWorkdays.length, ptoDays);

  const selector = Object.hasOwn(STRATEGY_MAP, strategy) ? STRATEGY_MAP[strategy] : DEFAULT_STRATEGY;

  const selection = selector(bridges, effectivePtoDays);

  return {
    days: selection.days.toSorted((a, b) => a.getTime() - b.getTime()),
    bridges: selection.bridges,
    strategy,
  };
}
