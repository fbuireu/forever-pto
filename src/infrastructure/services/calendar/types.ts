export interface Bridge {
  startDate: Date;
  endDate: Date;
  ptoDaysNeeded: number;
  effectiveDays: number;
  efficiency: number;
  ptoDays: Date[];
  type: 'perfect' | 'good' | 'acceptable' | 'regular';
  description?: string;
}

export interface Suggestion {
  days: Date[];
  totalEffectiveDays: number;
  efficiency?: number;
  bridges?: Bridge[];
  strategy?: OptimizationStrategy;
}

export type OptimizationStrategy = 'grouped' | 'optimized' | 'balanced';
