"use client";

import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import { differenceInDays, getDayOfMonth, getMonth, getYear } from "@application/shared/utils/dates";
import type { Suggestion } from "@domain/calendar/types";
import { cn } from "@ui/utils/cn";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Temporal } from "temporal-polyfill";
import { MONTHS_IN_YEAR } from "../utils/helpers";

interface Seg {
	start: Date;
	end: Date;
}

function getDaysInMonth(month: number, year: number) {
	return Temporal.PlainYearMonth.from({ year, month: month + 1 }).daysInMonth;
}

function windowColumn(date: Date, year: number) {
	return (getYear(date) - year) * MONTHS_IN_YEAR + getMonth(date);
}

function segPos(date: Date, year: number, monthCount: number) {
	const day = getDayOfMonth(date);
	const daysInMonth = getDaysInMonth(getMonth(date), getYear(date));
	return (windowColumn(date, year) + (day - 1) / daysInMonth) / monthCount;
}

function segWidth(start: Date, end: Date, year: number, monthCount: number) {
	const daysInMonth = getDaysInMonth(getMonth(end), getYear(end));
	const endFrac = (windowColumn(end, year) + getDayOfMonth(end) / daysInMonth) / monthCount;
	return Math.max(endFrac - segPos(start, year, monthCount), 0.005);
}

function groupDates(dates: Date[], maxGapDays: number) {
	if (!dates.length) return [];
	const sorted = dates.toSorted((a, b) => a.getTime() - b.getTime());
	const out: Seg[] = [];
	let s = sorted[0];
	let e = sorted[0];
	for (let i = 1; i < sorted.length; i++) {
		if (differenceInDays(sorted[i], e) <= maxGapDays) {
			e = sorted[i];
		} else {
			out.push({ start: s, end: e });
			s = sorted[i];
			e = sorted[i];
		}
	}
	out.push({ start: s, end: e });
	return out;
}

interface YearTimelineChartProps {
	year: number;
	carryOverMonths: number;
	holidays: HolidayDTO[];
	suggestion: Suggestion | null;
	manuallySelectedDays: Date[];
}

const ROW_COLOR: Record<string, string> = {
	national: "bg-[var(--color-brand-yellow)]",
	regional: "bg-[var(--color-brand-yellow)]",
	custom: "bg-[color-mix(in_srgb,var(--color-brand-purple)_28%,white_72%)]",
	pto: "bg-[var(--color-brand-teal)]",
	bridges: "bg-[var(--color-brand-orange)]",
	manual: "bg-[color-mix(in_srgb,var(--color-brand-purple)_18%,var(--color-brand-teal)_82%)]",
};

export const YearTimelineChart = ({
	year,
	carryOverMonths,
	holidays,
	suggestion,
	manuallySelectedDays,
}: YearTimelineChartProps) => {
	const t = useTranslations("summary");
	const locale = useLocale();
	const monthCount = MONTHS_IN_YEAR + carryOverMonths;

	const months = useMemo(
		() =>
			Array.from({ length: monthCount }, (_, i) => {
				const date = new Date(year, i, 1);
				return {
					key: `${getYear(date)}-${getMonth(date)}`,
					label: date.toLocaleDateString(locale, { month: "short" }).toUpperCase(),
				};
			}),
		[year, locale, monthCount],
	);

	const rows = useMemo(() => {
		const national: Seg[] = [];
		const regional: Seg[] = [];
		const custom: Seg[] = [];
		for (const h of holidays) {
			const seg = { start: h.date, end: h.date };
			if (h.variant === HolidayVariant.NATIONAL) national.push(seg);
			else if (h.variant === HolidayVariant.REGIONAL) regional.push(seg);
			else if (h.variant === HolidayVariant.CUSTOM) custom.push(seg);
		}

		const pto = groupDates(suggestion?.days ?? [], 3);

		const bridges = (suggestion?.bridges ?? []).map((b) => ({
			start: b.startDate,
			end: b.endDate,
		}));

		const manual = manuallySelectedDays.map((d) => ({ start: d, end: d }));

		return [
			{ key: "national", label: t("yearTimeline.rows.national"), segs: national },
			{ key: "regional", label: t("yearTimeline.rows.regional"), segs: regional },
			{ key: "custom", label: t("yearTimeline.rows.custom"), segs: custom },
			{ key: "pto", label: t("yearTimeline.rows.pto"), segs: pto },
			{ key: "bridges", label: t("yearTimeline.rows.bridges"), segs: bridges },
			{ key: "manual", label: t("yearTimeline.rows.manual"), segs: manual },
		].filter((row) => row.segs.length > 0);
	}, [holidays, suggestion, manuallySelectedDays, t]);

	return (
		<div className="w-full border-[3px] border-[var(--frame)] rounded-[10px] shadow-[var(--shadow-brutal-sm)] overflow-hidden bg-card">
			<div className="flex gap-2.5 px-3 border-b-[3px] border-[var(--frame)]">
				<div className="w-[70px] shrink-0" />
				<div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${monthCount}, minmax(0, 1fr))` }}>
					{months.map(({ key, label }, i) => (
						<div
							key={key}
							className={cn(
								"py-2 px-1 text-center text-[11px] font-mono font-bold tracking-[0.05em]",
								i < monthCount - 1 && "border-r-[2px] border-[var(--frame)]",
							)}
						>
							{label}
						</div>
					))}
				</div>
			</div>

			<div className="p-3 flex flex-col gap-2">
				{rows.map(({ key, label, segs }) => (
					<div key={key} className="flex items-center gap-2.5">
						<div className="w-[70px] shrink-0 overflow-hidden text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-muted-foreground leading-none">
							{label}
						</div>
						<div className="flex-1 h-4 bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-full relative overflow-hidden">
							{segs.map((seg) => (
								<div
									key={seg.start.toISOString()}
									className={cn("absolute inset-y-0 rounded-full border-[2px] border-[var(--frame)]", ROW_COLOR[key])}
									style={{
										left: `${segPos(seg.start, year, monthCount) * 100}%`,
										width: `max(8px, ${segWidth(seg.start, seg.end, year, monthCount) * 100}%)`,
									}}
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
