"use client";

import { differenceInDays, formatDate } from "@application/shared/utils/dates";
import { useHolidaysStore } from "@application/stores/holidays";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { Trash2 } from "@ui/modules/core/animate/icons/Trash2";
import { SlidingNumber } from "@ui/modules/core/animate/text/SlidingNumber";
import { Button } from "@ui/modules/core/primitives/Button";
import type { FromTo } from "@ui/modules/pages/planner/calendar/Calendar";
import { isFromToObject } from "@ui/modules/pages/planner/calendar/utils/helpers";
import {
	calculateHolidaysInRange,
	calculateWeekends,
	calculateWorkdays,
} from "@ui/modules/pages/planner/utils/helpers";
import { CalendarDays } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { SidebarFieldLabel } from "./SidebarFieldLabel";

const CalendarModal = dynamic(() =>
	import("./WorkdayCounterCalendarModal").then((module) => ({ default: module.WorkdayCounterCalendarModal })),
);

export const WorkdayCounter = () => {
	const locale = useLocale();
	const t = useTranslations("workdayCounter");
	const [selectedRange, setSelectedRange] = useState<FromTo | undefined>();
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	const { holidays } = useHolidaysStore(
		useShallow((state) => ({
			holidays: state.holidays,
		})),
	);

	const handleRangeSelect = (date: Date | Date[] | FromTo | undefined) => {
		if (!date) {
			setSelectedRange(undefined);
			return;
		}

		if (!isFromToObject(date)) {
			return;
		}

		setSelectedRange(date);
		setIsCalendarOpen(false);
		track({ event: "tool_used", properties: { tool: "workdayCounter" } });
	};

	const clearSelection = () => {
		setSelectedRange(undefined);
	};

	const workdayCount = selectedRange ? calculateWorkdays({ range: selectedRange, holidays }) : 0;
	const totalDays = selectedRange
		? differenceInDays({ dateLeft: selectedRange.to, dateRight: selectedRange.from }) + 1
		: 0;
	const weekendDays = selectedRange ? calculateWeekends(selectedRange) : 0;
	const holidayDays = selectedRange ? calculateHolidaysInRange({ range: selectedRange, holidays }) : 0;

	const knownHolidayYears = useMemo(() => {
		const years = holidays.map((holiday) => holiday.date.getFullYear());
		return years.length > 0 ? { first: Math.min(...years), last: Math.max(...years) } : null;
	}, [holidays]);

	const reachesUnknownYears =
		!!selectedRange?.from &&
		!!selectedRange?.to &&
		!!knownHolidayYears &&
		(selectedRange.from.getFullYear() < knownHolidayYears.first ||
			selectedRange.to.getFullYear() > knownHolidayYears.last);

	return (
		<div className="space-y-2 w-full">
			<SidebarFieldLabel
				className="my-0"
				icon={<CalendarDays size={16} />}
				title={t("title")}
				tooltip={{ label: t("tooltipLabel"), content: t("tooltip"), className: "w-60" }}
			/>

			<div className="space-y-2 w-full">
				<p className="text-xs text-muted-foreground">{t("selectRange")}</p>
				<div className="flex gap-2">
					<div className="min-w-0 flex-1">
						<CalendarModal
							open={isCalendarOpen}
							setOpen={setIsCalendarOpen}
							selectedRange={selectedRange}
							handleRangeSelect={handleRangeSelect}
							locale={locale}
							holidays={holidays}
						/>
					</div>
					{selectedRange && (
						<AnimateIcon animateOnHover>
							<Button
								variant="destructive"
								size="icon"
								onClick={clearSelection}
								aria-label={t("clearSelection")}
								title={t("clearSelection")}
							>
								<Trash2 />
							</Button>
						</AnimateIcon>
					)}
				</div>
			</div>

			{selectedRange && (
				<div className="space-y-2 w-full bg-muted rounded-md p-3">
					<div className="text-xs">
						<span className="font-display font-medium">{t("workdays")}</span>
						<div className="text-2xl font-display font-bold text-primary">
							<SlidingNumber number={workdayCount} decimalPlaces={0} />
						</div>
						<p className="text-muted-foreground">{t("businessDays")}</p>
					</div>

					<div className="flex justify-between items-start text-xs border-t pt-3">
						<div className="text-left">
							<div className="font-display font-medium">{t("days")}</div>
							<div className="text-lg font-display font-bold">
								<SlidingNumber number={totalDays} decimalPlaces={0} />
							</div>
						</div>
						<div className="text-left">
							<div className="font-display font-medium">{t("weekendDays")}</div>
							<div className="text-lg font-display font-bold text-muted-foreground">
								<SlidingNumber number={weekendDays} decimalPlaces={0} />
							</div>
						</div>
						<div className="text-left">
							<div className="font-display font-medium">{t("holidays")}</div>
							<div className="text-lg font-display font-bold text-muted-foreground">
								<SlidingNumber number={holidayDays} decimalPlaces={0} />
							</div>
						</div>
					</div>

					{reachesUnknownYears && knownHolidayYears && (
						<p className="text-[11px] text-caution-note">
							{t("holidaysOutsideRange", { from: knownHolidayYears.first, to: knownHolidayYears.last })}
						</p>
					)}

					<div className="bg-info-surface p-3 rounded text-xs">
						<p className="text-info-title font-display font-medium">{t("dateRange")}</p>
						<p className="text-info-text">
							{t("selectedRange", {
								from: formatDate({ date: selectedRange.from, locale, format: "EEEE, MMMM d, yyyy" }),
								to: formatDate({ date: selectedRange.to, locale, format: "EEEE, MMMM d, yyyy" }),
							})}
						</p>
					</div>
				</div>
			)}
		</div>
	);
};
