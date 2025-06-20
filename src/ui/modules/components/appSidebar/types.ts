export interface FilterMaximumValues {
	carry_over_months: {
		free: number;
		premium: number;
	};
	years: (year: string) => number[];
}
