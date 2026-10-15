export interface DaySpan {
	start: number;
	end: number;
}

export const spanLength = ({ start, end }: DaySpan): number => Math.max(0, end - start + 1);
