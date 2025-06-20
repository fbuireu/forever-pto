export interface EffectiveRatio {
	effective: number;
	ratio: number;
}

export interface ScoreMultipliers {
	default: number;
	consecutive_days: {
		threshold: number;
	};
	efficiency_ratio: {
		high: number;
		medium: number;
	};
	bonus: {
		high_efficiency: number;
		medium_efficiency: number;
		long_sequence: number;
	};
	tolerance: {
		single_day: number;
		multi_day: number;
		score_difference: number;
	};
	selection: {
		high_efficiency_threshold: number;
		holiday_benefit_threshold: number;
		benefit_alternative_threshold: number;
		block_size_difference: number;
		efficiency_difference: number;
		score_difference: number;
		min_score_per_day: number;
		min_multi_day_size: number;
	};
}

export interface CalendarLimits {
	max_block_size: number;
	max_search_depth: number;
	max_alternatives: number;
}
