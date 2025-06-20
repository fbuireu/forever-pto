"use client";

import type { SearchParams } from "@const/types";
import { createQueryString } from "@modules/components/appSidebar/components/appSidebar/utils/createQueryString/createQueryString";
import { FILTER_MAXIMUM_VALUES } from "@modules/components/appSidebar/const";
import { Label } from "@modules/components/core/label/Label";
import { SelectItem } from "@modules/components/core/select/atoms/selectItem/SelectItem";
import { SelectTrigger } from "@modules/components/core/select/atoms/selectTrigger/SelectTrigger";
import { SelectValue } from "@modules/components/core/select/atoms/selectValue/SelectValue";
import { Select } from "@modules/components/core/select/Select";
import { SelectContent } from "@ui/modules/components/core/select/atoms/selectContent/SelectContent";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useCallback, useId, useMemo, useState } from "react";

export interface YearsProps {
	year: SearchParams["year"];
}

export const Years = ({ year: yearProps }: YearsProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const id = useId();
	const [year, setYear] = useState(yearProps);

	const handleYearChange = useCallback(
		(value: string) => {
			setYear(value);

			const newYear = Number(value);
			const query = createQueryString({
				type: "year",
				value: String(newYear),
				searchParams,
			});

			startTransition(() => router.push(`${pathname}?${query}`, { scroll: false }));
		},
		[pathname, router, searchParams],
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
