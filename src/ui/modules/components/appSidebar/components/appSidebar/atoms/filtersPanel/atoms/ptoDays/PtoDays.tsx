"use client";

import type { SearchParams } from "@const/types";
import { MinusButton } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/atoms/MinusButton/MinusButton";
import { PlusButton } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/atoms/PlusButton/PlusButton";
import { createQueryString } from "@modules/components/appSidebar/components/appSidebar/utils/createQueryString/createQueryString";
import { Input } from "@modules/components/core/input/Input";
import { useDebouncedCallback } from "@ui/hooks/useDebounceCallback/useDebounceCallback";
import { Label } from "@ui/modules/components/core/label/Label";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { startTransition, useCallback, useMemo, useState } from "react";

export interface PtoDaysProps {
	ptoDays: SearchParams["ptoDays"];
}

export const PtoDays = ({ ptoDays }: PtoDaysProps) => {
	const t = useTranslations("filters.ptoDays");
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
				{t("got")}
			</Label>
			<MinusButton onClick={decrementDays} disabled={localDaysValue <= 0} />
			{daysInput}
			<PlusButton onClick={incrementDays} />
			<span className="text-end">{t("days", { days: localDaysValue })}</span>
		</div>
	);
};
