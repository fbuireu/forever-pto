"use client";

import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { useServerStore } from "@application/stores/server/serverStore";
import { FILTER_MAXIMUM_VALUES } from "@ui/modules/components/appSidebar/const";
import { Label } from "@ui/modules/components/core/label/Label";
import { Slider } from "@ui/modules/components/core/slider/Slider";
import { PremiumLock } from "@ui/modules/components/premium/components/premiumLock/PremiumLock";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";

export const CarryOverMonths = () => {
	const t = useTranslations("filters.carryOverMonths");
	const { carryOverMonths, updateCarryOverMonths } = useServerStore();
	const { isPremiumUser } = usePremiumStore();
	const debounceRef = useRef<NodeJS.Timeout>(null);

	const currentValue = Number(carryOverMonths) || 1;
	const value = useMemo(() => [currentValue], [currentValue]);

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

			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			debounceRef.current = setTimeout(() => {
				updateCarryOverMonths(String(newValue[0]));
			}, 100);
		},
		[isPremiumUser, updateCarryOverMonths],
	);

	const sliderDisabled = useMemo(() => !isPremiumUser && currentValue > 1, [isPremiumUser, currentValue]);

	const label = useMemo(
		() => (
			<div className="flex items-center justify-between">
				<Label htmlFor="months-slider" className="text-sm select-none">
					{t("monthsToShow", { months: currentValue })}
				</Label>
			</div>
		),
		[currentValue, t],
	);

	const sliderRangeLabels = useMemo(
		() => (
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>{t("rangeMin")}</span>
				<span>{t("rangeMax", { months: maxValue })}</span>
			</div>
		),
		[maxValue, t],
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
			<PremiumLock featureName={t("featureName")} featureDescription={t("featureDescription")}>
				{sliderComponent}
			</PremiumLock>
		);
	}

	return sliderComponent;
};
