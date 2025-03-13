"use client";

import type { SearchParams } from '@app/page';
import { Slider } from '@modules/components/core/Slider';
import { createQueryString } from '@shared/ui/utils/createQueryString';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useState } from 'react';
import { Label } from '../../core/Label';

interface MonthsToShowSliderProps {
	monthsToShow: SearchParams["monthsToShow"];
}

export const MonthsToShow = ({ monthsToShow }: MonthsToShowSliderProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [value, setValue] = useState([Number(monthsToShow)]);

	const handleValueChange = (newValue: number[]) => {
		setValue(newValue);

		const query = createQueryString({
			type: "monthsToShow",
			value: String(newValue[0]),
			searchParams,
		});

		startTransition(() => {
			router.push(`${pathname}?${query}`, { scroll: false });
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label htmlFor="months-slider" className="text-sm select-none">
					Meses a mostrar: {value[0]}
				</Label>
			</div>

			<Slider
				id="months-slider"
				min={1}
				max={12}
				step={1}
				value={value}
				onValueChange={handleValueChange}
				className="w-full"
			/>

			<div className="flex justify-between text-xs text-muted-foreground">
				<span>1 mes</span>
				<span>12 meses</span>
			</div>
		</div>
	);
};
