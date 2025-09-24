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
  bridges?: Bridge[];
  strategy?: FilterStrategy;
  metrics?: Metrics;
}

export const enum FilterStrategy {
  GROUPED = 'grouped',
  OPTIMIZED = 'optimized',
  BALANCED = 'balanced',
}

export interface FirstLastBreak {
  first: string;
  last: string;
}

export interface Metrics {
  longWeekends: number;
  restBlocks: number;
  maxWorkingPeriod: number;
  firstLastBreak: FirstLastBreak | null;
  averageEfficiency: number;
  bonusDays: number;
  quarterDist: number[];
  activeQuarters: string;
  totalEffectiveDays: number;
  efficiency?: number;
  monthlyDist: number[];
  longBlocksPerQuarter: number[];
}
