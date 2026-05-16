export const PTO_CONSTANTS = {
  // Max days to expand a bridge boundary backward or forward through free days.
  // Prevents an infinite loop if there is a very long holiday streak.
  SAFETY_LIMIT: 30,

  BRIDGE_GENERATION: {
    // Minimum effectiveDays/ptoDaysNeeded ratio for a bridge to be included in alternatives.
    MIN_EFFICIENCY_FOR_ALTERNATIVES: 2,
    // Minimum ratio required when the BALANCED strategy evaluates bridges.
    MIN_EFFICIENCY_FOR_BALANCED: 2,
    // Higher minimum for OPTIMIZED — only high-leverage bridges qualify.
    MIN_EFFICIENCY_FOR_OPTIMIZED: 2.5,
    // Efficiency differences smaller than this are treated as ties and resolved by effectiveDays.
    EFFICIENCY_COMPARISON_THRESHOLD: 0.1,
  },

  DAY_GROUPING: {
    // Max calendar days between two bridges to merge them into a single display group.
    MAX_DAYS_DIFF: 7,
    // Max days gap allowed when building a contiguous range from bridge days.
    MAX_DAYS_DIFF_FOR_RANGE: 4,
    // How many days ahead/behind to scan when looking for adjacent free days.
    MAX_SEARCH_DISTANCE: 5,
  },

  SCORING: {
    // Neutral multiplier — applied when a bridge does not qualify for multi-day bonus.
    BASE_SCORE: 1,
    // Slight boost for multi-day bridges in BALANCED strategy scoring.
    BALANCED_MULTI_DAY: 1.2,
    // Score boost when a bridge is within MAX_SEARCH_DISTANCE of another high-value bridge.
    PROXIMITY_BONUS: 3,
    // Multiplier applied to multi-day bridges that meet HIGH_VALUE thresholds.
    MULTI_DAY_BONUS: 1.5,
    // Weight of efficiency component in total score: score = (efficiency * 0.6 + value * 0.4) * bonus.
    EFFICIENCY: 0.6,
    // Weight of absolute value (effectiveDays / 10) component in total score.
    TOTAL_VALUE: 0.4,
  },

  SELECTION_WEIGHTS: {
    // Bridges with ptoDaysNeeded >= this are considered "high value" in the two-pass selector.
    HIGH_VALUE_THRESHOLD_DAYS: 3,
    // Bridges with effectiveDays >= this are considered "high value" in the two-pass selector.
    HIGH_VALUE_THRESHOLD_EFFECTIVE: 9,
  },

  EFFICIENCY: {
    // Ratio bands used to classify bridge quality in display and filtering.
    PERFECT: 4, // e.g. 1 PTO day → 4+ days off
    GOOD: 3,
    ACCEPTABLE: 2.5,
    MINIMUM: 2,
    // Single-bridge suggestions require a higher minimum to be worth showing alone.
    MINIMUM_FOR_SINGLE_BRIDGE: 3,
  },

  BRIDGE_SEARCH: {
    // Consecutive workday combinations to try: 2 and 3 days in addition to single-day bridges.
    MIN_MULTI_DAY_SIZE: 2,
    MAX_MULTI_DAY_SIZE: 3,
  },
} as const;
