"use client";

import type { SearchParams } from "@const/types";
import { createQueryString } from "@modules/components/appSidebar/components/appSidebar/utils/createQueryString/createQueryString";
import { Input } from "@modules/components/core/input/Input";
import { useDebouncedCallback } from "@ui/hooks/useDebounceCallback/useDebounceCallback";
import { Button } from "@ui/modules/components/core/button/Button";
import { Label } from "@ui/modules/components/core/label/Label";
import { Minus, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { memo, startTransition, useCallback, useMemo, useState } from "react";

const MinusButton = memo(({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
	<Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={onClick} disabled={disabled}>
		<Minus />
		<span className="sr-only">Decrease</span>
	</Button>
));
MinusButton.displayName = "MinusButton";

const PlusButton = memo(({ onClick }: { onClick: () => void }) => (
	<Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={onClick}>
		<Plus />
		<span className="sr-only">Increase</span>
	</Button>
));
PlusButton.displayName = "PlusButton";

export interface PtoDaysProps {
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

	const decrementDays = useCallback(() => {
		if (localDaysValue <= 0) return;
		updateQueryString(localDaysValue - 1);
	}, [localDaysValue, updateQueryString]);

	const incrementDays = useCallback(() => {
		updateQueryString(localDaysValue + 1);
	}, [localDaysValue, updateQueryString]);

	const handleInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const newValue = Number(event.currentTarget.value);
			if (!Number.isNaN(newValue) && newValue >= 0) {
				setLocalDaysValue(newValue);
				updateQueryDebounced(newValue);
			} else if (event.currentTarget.value === "") {
				setLocalDaysValue(0);
				updateQueryDebounced(0);
			}
		},
		[updateQueryDebounced],
	);

	const daysInput = useMemo(
		() => (
			<Input
				id="available-days"
				type="number"
				value={localDaysValue}
				onChange={handleInputChange}
				className="w-20"
				min="0"
			/>
		),
		[localDaysValue, handleInputChange],
	);

	return (
		<div className="flex items-center gap-2">
			<Label htmlFor="available-days" className="whitespace-nowrap">
				Tengo
			</Label>
			<MinusButton onClick={decrementDays} disabled={localDaysValue <= 0} />
			{daysInput}
			<PlusButton onClick={incrementDays} />
			<span>días libres</span>
		</div>
	);
};
