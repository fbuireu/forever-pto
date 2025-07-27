"use client";

import { useServerStore } from "@application/stores/server/serverStore";
import { MinusButton } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/atoms/MinusButton/MinusButton";
import { PlusButton } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/atoms/PlusButton/PlusButton";
import { Input } from "@modules/components/core/input/Input";
import { Label } from "@ui/modules/components/core/label/Label";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import { useCallback, useId, useMemo } from "react";
import { createQueryString } from "../../../../utils/createQueryString/createQueryString";

export const PtoDays = () => {
	const t = useTranslations("filters.ptoDays");
	const { ptoDays, updatePtoDays } = useServerStore();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const id = useId();

	const updateDays = useCallback(
		(newValue: number) => {
			updatePtoDays(String(newValue));

			const query = createQueryString({
				type: "ptoDays",
				value: String(newValue),
				searchParams,
			});
			window.history.pushState(null, "", `${pathname}?${query}`);
		},
		[updatePtoDays, pathname, searchParams],
	);

	const decrementDays = useCallback(() => {
		if (Number(ptoDays) <= 0) return;
		updateDays(Number(ptoDays) - 1);
	}, [ptoDays, updateDays]);

	const incrementDays = useCallback(() => {
		updateDays(Number(ptoDays) + 1);
	}, [ptoDays, updateDays]);

	const handleInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const newValue = Number(event.currentTarget.value);
			if (!Number.isNaN(newValue) && newValue >= 0) {
				updateDays(newValue);
			} else if (event.currentTarget.value === "") {
				updateDays(0);
			}
		},
		[updateDays],
	);

	const daysInput = useMemo(
		() => <Input id={id} type="number" value={ptoDays} onChange={handleInputChange} className="w-20" min="0" />,
		[ptoDays, handleInputChange, id],
	);

	return (
		<div className="flex items-center gap-2">
			<Label htmlFor={id} className="whitespace-nowrap">
				{t("got")}
			</Label>
			<MinusButton onClick={decrementDays} disabled={Number(ptoDays) <= 0} />
			{daysInput}
			<PlusButton onClick={incrementDays} />
			<span className="text-end">{t("days", { days: ptoDays })}</span>
		</div>
	);
};
