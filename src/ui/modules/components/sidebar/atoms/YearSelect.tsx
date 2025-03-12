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
	const initialYear = Number(year);
	const [localYear, setLocalYear] = useState(initialYear.toString());

	const handleYearChange = (value: string) => {
		setLocalYear(value);

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
				<Select value={localYear} onValueChange={handleYearChange}>
					<SelectTrigger id="year-select" className="w-full">
						<SelectValue placeholder="Year" />
					</SelectTrigger>
					<SelectContent>
						{yearOptions.map((yearOption) => (
								<SelectItem key={yearOption} value={yearOption.toString()}>
									{yearOption}
								</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
	);
};