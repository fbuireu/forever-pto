import { SCORE_MULTIPLIERS } from "../../../const";

interface CalculateBlockScoreParams {
	blockSize: number;
	totalConsecutiveDays: number;
	effectiveDays: number;
}

interface EfficiencyThreshold {
	threshold: number;
	bonus: number;
}

const EFFICIENCY_THRESHOLDS: EfficiencyThreshold[] = [
	{ threshold: SCORE_MULTIPLIERS.EFFICIENCY_RATIO.HIGH, bonus: SCORE_MULTIPLIERS.BONUS.HIGH_EFFICIENCY },
	{ threshold: SCORE_MULTIPLIERS.EFFICIENCY_RATIO.MEDIUM, bonus: SCORE_MULTIPLIERS.BONUS.MEDIUM_EFFICIENCY },
	{ threshold: 0, bonus: SCORE_MULTIPLIERS.DEFAULT },
] as const;

export function calculateBlockScore({
	blockSize,
	totalConsecutiveDays,
	effectiveDays,
}: CalculateBlockScoreParams): number {
	const efficiencyRatio = effectiveDays / blockSize;

	const efficiencyBonus =
		EFFICIENCY_THRESHOLDS.find(({ threshold }) => efficiencyRatio >= threshold)?.bonus ?? SCORE_MULTIPLIERS.DEFAULT;

	const sequenceBonus =
		totalConsecutiveDays >= SCORE_MULTIPLIERS.CONSECUTIVE_DAYS.THRESHOLD
			? SCORE_MULTIPLIERS.BONUS.LONG_SEQUENCE
			: SCORE_MULTIPLIERS.DEFAULT;

	return efficiencyRatio * efficiencyBonus * sequenceBonus;
}
