"use client";

import type { SearchParams } from "@const/types";
import { MinusButton } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/atoms/MinusButton/MinusButton";
import { PlusButton } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/atoms/PlusButton/PlusButton";
import { createQueryString } from "@modules/components/appSidebar/components/appSidebar/utils/createQueryString/createQueryString";
import { Input } from "@modules/components/core/input/Input";
import { Label } from "@ui/modules/components/core/label/Label";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import { startTransition, useCallback, useId, useMemo, useState } from "react";

export interface PtoDaysProps {
	ptoDays: SearchParams["ptoDays"];
}

export const PtoDays = ({ ptoDays }: PtoDaysProps) => {
	const t = useTranslations("filters.ptoDays");
	const router = useRouter();
	const pathname = usePathname();
	const id = useId();
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
				updateQueryString(newValue);
			} else if (event.currentTarget.value === "") {
				setLocalDaysValue(0);
				updateQueryString(0);
			}
		},
		[updateQueryString],
	);

	const daysInput = useMemo(
		() => <Input id={id} type="number" value={localDaysValue} onChange={handleInputChange} className="w-20" min="0" />,
		[localDaysValue, handleInputChange, id],
	);

	return (
		<div className="flex items-center gap-2">
			<Label htmlFor={id} className="whitespace-nowrap">
				{t("got")}
			</Label>
			<MinusButton onClick={decrementDays} disabled={localDaysValue <= 0} />
			{daysInput}
			<PlusButton onClick={incrementDays} />
			<span className="text-end">{t("days", { days: localDaysValue })}</span>
		</div>
	);
};
