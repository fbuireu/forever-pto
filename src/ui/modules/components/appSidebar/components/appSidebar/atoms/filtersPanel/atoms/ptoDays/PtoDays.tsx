"use client";

import { useServerStore } from "@application/stores/server/serverStore";
import { MinusButton } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/atoms/MinusButton/MinusButton";
import { PlusButton } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/atoms/PlusButton/PlusButton";
import { Input } from "@modules/components/core/input/Input";
import { Label } from "@ui/modules/components/core/label/Label";
import { useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import { useCallback, useId, useMemo, useState } from "react";

export const PtoDays = () => {
	const t = useTranslations("filters.ptoDays");
	const { ptoDays, updatePtoDays } = useServerStore();
	const id = useId();
	const initialDaysValue = Number(ptoDays);
	const [localDaysValue, setLocalDaysValue] = useState(initialDaysValue);

	const updateDays = useCallback(
		(newValue: number) => {
			setLocalDaysValue(newValue);
			updatePtoDays(String(newValue));
		},
		[updatePtoDays],
	);

	const decrementDays = useCallback(() => {
		if (localDaysValue <= 0) return;
		updateDays(localDaysValue - 1);
	}, [localDaysValue, updateDays]);

	const incrementDays = useCallback(() => {
		updateDays(localDaysValue + 1);
	}, [localDaysValue, updateDays]);

	const handleInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const newValue = Number(event.currentTarget.value);
			if (!Number.isNaN(newValue) && newValue >= 0) {
				setLocalDaysValue(newValue);
				updateDays(newValue);
			} else if (event.currentTarget.value === "") {
				setLocalDaysValue(0);
				updateDays(0);
			}
		},
		[updateDays],
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
