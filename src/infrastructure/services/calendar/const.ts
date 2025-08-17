import { OptimizationStrategy } from "./types";

export const PTO_CONSTANTS = {
  MAX_CONSECUTIVE_DAYS: 14,
  MAX_GAP_FOR_BRIDGE: 5,
  SAFETY_LIMIT: 30,
  MAX_EXPANSION_DISTANCE: 5,

  BLOCK_SHIFTS: {
    WEEKLY_SHIFTS: [-21, -14, -7, 7, 14, 21],
    MAX_ROTATION_DAYS: 14,
    MAX_DAYS_TO_ADD: 14,
  },

  BRIDGE_GENERATION: {
    MAX_BLOCK_COMBINATIONS: 3,
    MAX_MEDIUM_BLOCKS: 5,
    MAX_SKIP_FIRST: 3,
    MIN_EFFICIENCY_FOR_SINGLE: 3,
    MIN_EFFICIENCY_FOR_MEDIUM: 2.5,
    MIN_EFFICIENCY_FOR_ALTERNATIVES: 2,
    MIN_EFFICIENCY_FOR_OPTIMIZED: 2.5,
    EFFICIENCY_COMPARISON_THRESHOLD: 0.1,
  },

  DAY_GROUPING: {
    MAX_DAYS_DIFF: 7,
    MAX_DAYS_DIFF_FOR_RANGE: 4,
    MAX_SEARCH_DISTANCE: 5,
  },

  SCORING: {
    BASE_SCORE: 1,
    MONDAY_FRIDAY_BONUS: 2,
    HOLIDAY_ADJACENT_BONUS: 3,
    PERFECT_BRIDGE_BONUS: 5,
    LONG_WEEKEND_BONUS: 2,
    PROXIMITY_BONUS: 3,
    GROUPED_PENALTY: 0.5,
    GROUPED_BONUS: 1.5,
    BALANCED_PROXIMITY_BONUS: 3,
  },

  EFFICIENCY: {
    PERFECT: 4,
    GOOD: 3,
    ACCEPTABLE: 2.5,
    MINIMUM: 2,
    MINIMUM_FOR_SINGLE_BRIDGE: 3,
    MINIMUM_FOR_BRIDGE_CREATION: 3,
  },

  STRATEGY_CONFIG: {
    grouped: {
      minEfficiency: 2,
      preferredBlockSize: { min: 3, max: 10 },
      allowSingleDays: false,
      prioritizeProximity: true,
      description: 'Agrupa días en bloques consecutivos para vacaciones continuas',
    },
    optimized: {
      minEfficiency: 3,
      preferredBlockSize: { min: 1, max: 5 },
      allowSingleDays: true,
      prioritizeProximity: false,
      description: 'Maximiza la eficiencia seleccionando los mejores puentes individuales',
    },
    balanced: {
      minEfficiency: 2.5,
      preferredBlockSize: { min: 2, max: 7 },
      allowSingleDays: true,
      prioritizeProximity: true,
      description: 'Balance entre eficiencia y agrupación de días',
    },
  },

  BRIDGE_TYPES: {
    PERFECT: 'perfect',
    GOOD: 'good',
    ACCEPTABLE: 'acceptable',
    REGULAR: 'regular',
  },
} as const;

export type StrategyConfiguration = (typeof PTO_CONSTANTS.STRATEGY_CONFIG)[OptimizationStrategy];
