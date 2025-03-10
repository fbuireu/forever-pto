"use client";

import type { SearchParams } from '@app/page';
import { createQueryString } from '@shared/ui/utils/createQueryString';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useState } from 'react';
import { Label } from '../../core/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../core/Select';

interface YearSelectProps {
	year: SearchParams["year"];
}

export const YearSelect = ({ year }: YearSelectProps) => {
	const yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [selectedYear, setSelectedYear] = useState(() => {
		const paramYear = searchParams.get("year");
		return paramYear ? Number(paramYear) : year;
	});

	const handleYearChange = (value: string) => {
		const newYear = Number(value);
		setSelectedYear(newYear);

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
			<Select value={selectedYear.toString()} onValueChange={handleYearChange}>
				<SelectTrigger id="year-select" className="w-full">
					<SelectValue placeholder="Year" />
				</SelectTrigger>
				<SelectContent>
					{yearOptions.map((year) => (
						<SelectItem key={year} value={year.toString()}>
							{year}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
