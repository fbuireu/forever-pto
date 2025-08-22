export interface Bridge {
  startDate: Date;
  endDate: Date;
  ptoDaysNeeded: number;
  effectiveDays: number;
  efficiency: number;
  ptoDays: Date[];
}

export interface Suggestion {
  days: Date[];
  totalEffectiveDays: number;
  efficiency?: number;
  bridges?: Bridge[];
  strategy: OptimizationStrategy;
}

export const enum OptimizationStrategy {
  GROUPED = 'grouped',
  OPTIMIZED = 'optimized',
  BALANCED = 'balanced',
}
