interface CalculateBlockScoreParams {
	blockSize: number;
	totalConsecutiveDays: number;
}

export function calculateBlockScore({ blockSize, totalConsecutiveDays }: CalculateBlockScoreParams): number {
	const efficiencyRatio = totalConsecutiveDays / blockSize;
	let score = efficiencyRatio * totalConsecutiveDays * 100;

	if (totalConsecutiveDays >= 7) score *= 1.5;
	if (blockSize >= 3) score *= 1.2;

	return score;
}
