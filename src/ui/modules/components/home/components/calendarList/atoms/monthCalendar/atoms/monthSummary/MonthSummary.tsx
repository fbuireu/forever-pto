import { MonthSummaryTooltip } from "@modules/components/home/components/calendarList/atoms/monthCalendar/atoms/monthSummary/atoms/monthSummaryTooltip/MonthSummaryTooltip";
import type { ReactNode } from "react";

interface MonthSummaryProps {
	ptoDays: number;
	suggestedDays: Date[];
	monthSummary: ReactNode;
}

export const MonthSummary = ({ ptoDays, monthSummary, suggestedDays }: MonthSummaryProps) => (
	<>
		{ptoDays > 0 && suggestedDays.length > 0 && monthSummary && (
			<div className="rounded-md border border-primary/20 bg-green-200/10 p-2 text-xs">
				<div className="flex items-center justify-between">
					<p className="mb-1 font-semibold">Sugerencia:</p>
					<MonthSummaryTooltip />
				</div>

				{monthSummary}
			</div>
		)}
	</>
);
