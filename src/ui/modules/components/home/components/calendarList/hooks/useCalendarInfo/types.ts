export type IntervalInfo = {
	interval: Date[];
	ptoDays: number;
	totalFreeDays: number;
	startDate: Date;
	endDate: Date;
};

export type BlockPosition = "start" | "middle" | "end" | "single" | null;
