"use client";

import type { SearchParams } from '@app/page';
import { createQueryString } from '@shared/ui/utils/createQueryString';
import { useDebouncedCallback } from '@ui/hooks/useDebounceCallback';
import { Minus, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { startTransition, useCallback, useState } from 'react';
import { Label } from '@modules/components/core/Label';
import { Button } from '@modules/components/core/Button';
import { Input } from '../../core/Input';

interface PtoDaysInputProps {
	ptoDays: SearchParams["ptoDays"];
}

export const PtoDaysInput = ({ ptoDays }: PtoDaysInputProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [inputValue, setInputValue] = useState(() => {
		const paramPtoDays = searchParams.get("ptoDays");
		return paramPtoDays ? Number(paramPtoDays) : Number(ptoDays);
	});

	const updateQueryString = useCallback(
		(newValue: number) => {
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
		if (inputValue <= 0) return;
		const newValue = inputValue - 1;
		setInputValue(newValue);
		updateQueryString(newValue);
	};

	const incrementDays = () => {
		const newValue = inputValue + 1;
		setInputValue(newValue);
		updateQueryString(newValue);
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = Number(event.currentTarget.value);
		if (!Number.isNaN(newValue) && newValue >= 0) {
			setInputValue(newValue);
			updateQueryDebounced(newValue);
		} else if (event.currentTarget.value === "") {
			setInputValue(0);
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
				disabled={inputValue <= 0}
			>
				<Minus />
				<span className="sr-only">Decrease</span>
			</Button>
			<Input
				id="available-days"
				type="number"
				value={inputValue}
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
