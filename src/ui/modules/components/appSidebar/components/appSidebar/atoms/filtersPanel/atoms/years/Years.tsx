"use client";

import { useServerStore } from "@application/stores/server/serverStore";
import { FILTER_MAXIMUM_VALUES } from "@modules/components/appSidebar/const";
import { Label } from "@modules/components/core/label/Label";
import { SelectItem } from "@modules/components/core/select/atoms/selectItem/SelectItem";
import { SelectTrigger } from "@modules/components/core/select/atoms/selectTrigger/SelectTrigger";
import { SelectValue } from "@modules/components/core/select/atoms/selectValue/SelectValue";
import { Select } from "@modules/components/core/select/Select";
import { SelectContent } from "@ui/modules/components/core/select/atoms/selectContent/SelectContent";
import { useCallback, useId, useMemo } from "react";

export const Years = () => {
	const { year, updateYear } = useServerStore();
	const id = useId();

	const handleYearChange = useCallback(
		(value: string) => {
			updateYear(value);
		},
		[updateYear],
	);

	const yearOptions = useMemo(
		() =>
			(FILTER_MAXIMUM_VALUES.YEARS as (year: string) => number[])(year).map((yearOption) => (
				<SelectItem key={yearOption} value={yearOption.toString()}>
					{yearOption}
				</SelectItem>
			)),
		[year],
	);

	const selectComponent = useMemo(
		() => (
			<Select value={year} onValueChange={handleYearChange}>
				<SelectTrigger id={id} className="w-full">
					<SelectValue placeholder="Year" />
				</SelectTrigger>
				<SelectContent>{yearOptions}</SelectContent>
			</Select>
		),
		[year, handleYearChange, yearOptions, id],
	);

	return (
		<div className="flex items-center gap-2">
			<Label htmlFor="year-select" className="whitespace-nowrap" />
			{selectComponent}
		</div>
	);
};
