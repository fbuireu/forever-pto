"use client";

import type { SearchParams } from '@app/page';
import { Button } from '@modules/components/core/Button';
import { Label } from '@modules/components/core/Label';
import { createQueryString } from '@shared/ui/utils/createQueryString';
import { useDebouncedCallback } from '@ui/hooks/useDebounceCallback';
import { Minus, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ChangeEvent } from 'react';
import { startTransition, useCallback, useState } from 'react';
import { Input } from '../../core/Input';

interface PtoDaysProps {
	ptoDays: SearchParams["ptoDays"];
}

export const PtoDays = ({ ptoDays }: PtoDaysProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const initialDaysValue = Number(ptoDays);
	const [localDaysValue, setLocalDaysValue] = useState(initialDaysValue);

	const updateQueryString = useCallback(
		(newValue: number) => {
			setLocalDaysValue(newValue);

			const query = createQueryString({
				type: "ptoDays",
				value: String(newValue),
				searchParams,
			});

			startTransition(() => router.push(`${pathname}?${query}`, { scroll: false }));
		},
		[router, pathname, searchParams],
	);

	const updateQueryDebounced = useDebouncedCallback((value: number) => updateQueryString(value), 200);

	const decrementDays = () => {
		if (localDaysValue <= 0) return;
		updateQueryString(localDaysValue - 1);
	};

	const incrementDays = () => {
		updateQueryString(localDaysValue + 1);
	};

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const newValue = Number(event.currentTarget.value);
		if (!Number.isNaN(newValue) && newValue >= 0) {
			setLocalDaysValue(newValue);
			updateQueryDebounced(newValue);
		} else if (event.currentTarget.value === "") {
			setLocalDaysValue(0);
			updateQueryDebounced(0);
		}
	};

	return (
		<div className="flex items-center gap-2">
			<Label htmlFor="available-days" className="whitespace-nowrap">
				Tengo
			</Label>
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8 shrink-0 rounded-full"
				onClick={decrementDays}
				disabled={localDaysValue <= 0}
			>
				<Minus />
				<span className="sr-only">Decrease</span>
			</Button>
			<Input
				id="available-days"
				type="number"
				value={localDaysValue}
				onChange={handleInputChange}
				className="w-20"
				min="0"
			/>
			<Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={incrementDays}>
				<Plus />
				<span className="sr-only">Increase</span>
			</Button>
			<span>días libres</span>
		</div>
	);
};
