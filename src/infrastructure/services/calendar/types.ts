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
  strategy?: FilterStrategy;
}

export const enum FilterStrategy {
  GROUPED = 'grouped',
  OPTIMIZED = 'optimized',
  BALANCED = 'balanced',
}
