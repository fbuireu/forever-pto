"use client";

import { getMonthNames } from "@application/shared/utils/dates";
import { Button } from "@ui/modules/core/primitives/Button";
import { useLocale } from "next-intl";
import { useMemo } from "react";

interface MonthTogglesProps {
	label: string;
	months: readonly number[];
	onChange: (months: number[]) => void;
	reachable: ReadonlySet<number>;
	legendClassName?: string;
}

export const MonthToggles = ({
	label,
	months,
	onChange,
	reachable,
	legendClassName = "sr-only",
}: MonthTogglesProps) => {
	const locale = useLocale();
	const monthNames = useMemo(() => {
		const longNames = getMonthNames({ locale, format: "long" });
		return getMonthNames({ locale }).map((short, month) => ({ month, short, long: longNames[month] }));
	}, [locale]);

	const handleToggle = (month: number) =>
		onChange(months.includes(month) ? months.filter((selected) => selected !== month) : [...months, month]);

	return (
		<fieldset className="min-w-0">
			<legend className={legendClassName}>{label}</legend>
			<div className="grid grid-cols-4 gap-1.5">
				{monthNames.map(({ month, short, long }) => {
					const disabled = !reachable.has(month);
					const selected = !disabled && months.includes(month);

					return (
						<Button
							key={month}
							type="button"
							size="sm"
							variant={selected ? "default" : "outline"}
							aria-pressed={selected}
							aria-label={long}
							disabled={disabled}
							onClick={() => handleToggle(month)}
							className="px-1.5 text-xs capitalize"
						>
							{short}
						</Button>
					);
				})}
			</div>
		</fieldset>
	);
};
