"use client";

import { FILTER_MAXIMUM_VALUES } from "@const/const";
import type { SearchParams } from "@const/types";
import { createQueryString } from "@modules/components/appSidebar/components/appSidebar/utils/createQueryString/createQueryString";
import { usePremium } from "@ui/hooks/usePremium/usePremium";
import { Label } from "@ui/modules/components/core/label/Label";
import { Slider } from "@ui/modules/components/core/slider/Slider";
import { PremiumLock } from "@ui/modules/components/premium/components/premiumLock/PremiumLock";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useCallback, useMemo, useState } from "react";

export interface CarryOverMonthsProps {
	carryOverMonths: SearchParams["carryOverMonths"];
}

export const CarryOverMonths = ({ carryOverMonths }: CarryOverMonthsProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { isPremiumUser } = usePremium();
	const [value, setValue] = useState([Number(carryOverMonths)]);

	const maxValue = useMemo(
		() =>
			isPremiumUser ? FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.PREMIUM : FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.FREE,
		[isPremiumUser],
	);

	const handleValueChange = useCallback(
		(newValue: number[]) => {
			if (!isPremiumUser && newValue[0] > 1) {
				return;
			}

			setValue(newValue);

			const query = createQueryString({
				type: "carryOverMonths",
				value: String(newValue[0]),
				searchParams,
			});

			startTransition(() => {
				router.push(`${pathname}?${query}`, { scroll: false });
			});
		},
		[isPremiumUser, router, pathname, searchParams],
	);

	const sliderDisabled = useMemo(() => !isPremiumUser && value[0] > 1, [isPremiumUser, value]);

	const label = useMemo(
		() => (
			<div className="flex items-center justify-between">
				<Label htmlFor="months-slider" className="text-sm select-none">
					Meses a mostrar: {value[0]}
				</Label>
			</div>
		),
		[value],
	);

	const sliderRangeLabels = useMemo(
		() => (
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>1 mes</span>
				<span>{maxValue} meses</span>
			</div>
		),
		[maxValue],
	);

	const sliderComponent = useMemo(
		() => (
			<div className="space-y-4">
				{label}
				<Slider
					min={1}
					max={maxValue}
					step={1}
					value={value}
					onValueChange={handleValueChange}
					disabled={sliderDisabled}
					className="w-full"
				/>

				{sliderRangeLabels}
			</div>
		),
		[label, maxValue, value, handleValueChange, sliderDisabled, sliderRangeLabels],
	);

	if (!isPremiumUser) {
		return (
			<PremiumLock
				isActive={true}
				featureName="Meses adicionales"
				description="Desbloquea la posibilidad de ver más meses del próximo año con tu suscripción premium."
			>
				{sliderComponent}
			</PremiumLock>
		);
	}

	return sliderComponent;
};
