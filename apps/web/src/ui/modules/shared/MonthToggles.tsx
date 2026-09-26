"use client";

import { getMonthNames } from "@application/shared/utils/dates";
import { type PlanningWindow, planningWindowMonths } from "@domain/calendar/window";
import { Button } from "@ui/modules/core/primitives/Button";
import { useLocale } from "next-intl";
import { useMemo } from "react";

interface MonthTogglesProps {
	label: string;
	window: PlanningWindow;
	months: readonly number[];
	onChange: (months: number[]) => void;
	reachable: ReadonlySet<number>;
	legendClassName?: string;
}

export const MonthToggles = ({
	label,
	window,
	months,
	onChange,
	reachable,
	legendClassName = "sr-only",
}: MonthTogglesProps) => {
	const locale = useLocale();
	const { year, carryOverMonths } = window;
	const years = useMemo(() => {
		const shortNames = getMonthNames({ locale });
		const longNames = getMonthNames({ locale, format: "long" });
		const byYear = new Map<number, { position: number; short: string; long: string }[]>();

		planningWindowMonths({ year, carryOverMonths }).forEach((date, position) => {
			const month = date.getMonth();
			const monthYear = date.getFullYear();
			const months = byYear.get(monthYear) ?? [];
			months.push({ position, short: shortNames[month] ?? "", long: `${longNames[month]} ${monthYear}` });
			byYear.set(monthYear, months);
		});

		return [...byYear].map(([groupYear, months]) => ({ year: groupYear, months }));
	}, [locale, year, carryOverMonths]);

	const handleToggle = (position: number) =>
		onChange(months.includes(position) ? months.filter((selected) => selected !== position) : [...months, position]);

	return (
		<fieldset className="min-w-0">
			<legend className={legendClassName}>{label}</legend>
			<div className="space-y-2">
				{years.map((group) => (
					<div key={group.year} className="space-y-1">
						{years.length > 1 && (
							<p aria-hidden className="font-mono text-[11px] font-bold text-muted-foreground">
								{group.year}
							</p>
						)}
						<div className="grid grid-cols-4 gap-1.5">
							{group.months.map(({ position, short, long }) => {
								const disabled = !reachable.has(position);
								const selected = !disabled && months.includes(position);

								return (
									<Button
										key={position}
										type="button"
										size="sm"
										variant={selected ? "default" : "outline"}
										aria-pressed={selected}
										aria-label={long}
										disabled={disabled}
										onClick={() => handleToggle(position)}
										className="px-1.5 text-xs capitalize"
									>
										{short}
									</Button>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</fieldset>
	);
};
