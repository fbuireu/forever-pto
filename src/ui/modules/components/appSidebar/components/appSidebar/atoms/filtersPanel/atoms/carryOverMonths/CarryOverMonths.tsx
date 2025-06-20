"use client";

import { usePremiumStore } from "@application/stores/premium/premiumStore";
import type { SearchParams } from "@const/types";
import { createQueryString } from "@modules/components/appSidebar/components/appSidebar/utils/createQueryString/createQueryString";
import { FILTER_MAXIMUM_VALUES } from "@ui/modules/components/appSidebar/const";
import { Label } from "@ui/modules/components/core/label/Label";
import { Slider } from "@ui/modules/components/core/slider/Slider";
import { PremiumLock } from "@ui/modules/components/premium/components/premiumLock/PremiumLock";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { startTransition, useCallback, useMemo, useState } from "react";

export interface CarryOverMonthsProps {
	carryOverMonths: SearchParams["carryOverMonths"];
}

export const CarryOverMonths = ({ carryOverMonths }: CarryOverMonthsProps) => {
	const t = useTranslations("filters.carryOverMonths");
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { isPremiumUser } = usePremiumStore();
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

			startTransition(() => router.push(`${pathname}?${query}`, { scroll: false }));
		},
		[isPremiumUser, router, pathname, searchParams],
	);

	const sliderDisabled = useMemo(() => !isPremiumUser && value[0] > 1, [isPremiumUser, value]);

	const label = useMemo(
		() => (
			<div className="flex items-center justify-between">
				<Label htmlFor="months-slider" className="text-sm select-none">
					{t("monthsToShow", { months: value[0] })}
				</Label>
			</div>
		),
		[value, t],
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
