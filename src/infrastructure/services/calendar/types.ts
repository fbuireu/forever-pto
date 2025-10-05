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

export const FilterStrategy = {
  GROUPED: 'grouped',
  OPTIMIZED: 'optimized',
  BALANCED: 'balanced',
} as const;

export type FilterStrategy = (typeof FilterStrategy)[keyof typeof FilterStrategy];

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
  bridgesUsed: number;
  workingDaysPerMonth: number;
  totalEffectiveDays: number;
  efficiency?: number;
  monthlyDist: number[];
  longBlocksPerQuarter: number[];
}
