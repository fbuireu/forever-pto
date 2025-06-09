export interface DayInfo {
	date: Date;
	isWeekend: boolean;
	isHoliday: boolean;
	isSelected: boolean;
	isFreeDay: boolean;
	month: number;
}

export interface BlockOpportunity {
	startDay: Date;
	days: Date[];
	blockSize: number;
	daysBeforeBlock: number;
	daysAfterBlock: number;
	totalConsecutiveDays: number;
	score: number;
	month: number;
	effectiveDays: number;
	holidayDays: number;
}
