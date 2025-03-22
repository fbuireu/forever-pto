"use client";

import { FILTER_MAXIMUM_VALUES } from '@const/const';
import type { SearchParams } from '@const/types';
import { Label } from '@modules/components/core/label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@modules/components/core/select/Select';
import { createQueryString } from '@shared/ui/utils/createQueryString';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useState } from 'react';

interface YearsProps {
	year: SearchParams["year"];
}

export const Years = ({ year: yearProps }: YearsProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [year, setYear] = useState(yearProps);

	const handleYearChange = (value: string) => {
		setYear(value);

		const newYear = Number(value);
		const query = createQueryString({
			type: "year",
			value: String(newYear),
			searchParams,
		});

		startTransition(() => {
			router.push(`${pathname}?${query}`, { scroll: false });
		});
	};

	return (
		<div className="flex items-center gap-2">
			<Label htmlFor="year-select" className="whitespace-nowrap" />
			<Select value={year} onValueChange={handleYearChange}>
				<SelectTrigger id="year-select" className="w-full">
					<SelectValue placeholder="Year" />
				</SelectTrigger>
				<SelectContent>
					{FILTER_MAXIMUM_VALUES.YEARS(year).map((yearOption) => (
						<SelectItem key={yearOption} value={yearOption.toString()}>
							{yearOption}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
