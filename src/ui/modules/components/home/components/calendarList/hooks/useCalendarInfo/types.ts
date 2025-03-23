export type IntervalInfo = {
	interval: Date[];
	ptoDays: number;
	totalFreeDays: number;
	startDate: Date;
	endDate: Date;
};

export type BlockPosition = "start" | "middle" | "end" | "single" | null;

export interface CalendarStats {
	country?: string;
	region?: string;
	nationalHolidays: number;
	regionalHolidays: number;
	totalHolidays: number;
	ptoDaysAvailable: number;
	ptoDaysUsed: number;
	effectiveDays: number;
	effectiveRatio: string;
}

export interface VacationStats {
	country?: string;
	region?: string;
	nationalHolidays: number;
	regionalHolidays: number;
	totalHolidays: number;
	ptoDaysAvailable: number;
	ptoDaysUsed: number;
	effectiveDays: number;
	effectiveRatio: string;
}
