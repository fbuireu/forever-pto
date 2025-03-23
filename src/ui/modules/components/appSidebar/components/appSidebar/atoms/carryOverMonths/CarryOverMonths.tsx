"use client";

import { FILTER_MAXIMUM_VALUES } from '@const/const';
import type { SearchParams } from '@const/types';
import {
    createQueryString,
} from '@modules/components/appSidebar/components/appSidebar/utils/createQueryString/createQueryString';
import { Label } from '@ui/modules/components/core/label/Label';
import { Slider } from '@ui/modules/components/core/slider/Slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ui/modules/components/core/tooltip/Tooltip';
import { PremiumLock } from '@ui/modules/components/premium/components/premiumLock/PremiumLock';
import { usePremium } from '@ui/providers/premium/PremiumProvider';
import { InfoIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { memo, startTransition, useCallback, useMemo, useState } from 'react';

const InfoTooltip = memo(() => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>
				<InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
			</TooltipTrigger>
			<TooltipContent className="max-w-xs">
				<p>Permite añadir meses de carryover al siguiente año</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
));
InfoTooltip.displayName = "InfoTooltip";

interface CarryOverMonthsProps {
	carryOverMonths: SearchParams["carryOverMonths"];
}

export const CarryOverMonths = ({ carryOverMonths }: CarryOverMonthsProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { isPremium } = usePremium();
	const [value, setValue] = useState([Number(carryOverMonths)]);

	const maxValue = useMemo(
		() => (isPremium ? FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.PREMIUM : FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.FREE),
		[isPremium],
	);

	const handleValueChange = useCallback(
		(newValue: number[]) => {
			if (!isPremium && newValue[0] > 1) {
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
		[isPremium, router, pathname, searchParams],
	);

	const sliderDisabled = useMemo(() => !isPremium && value[0] > 1, [isPremium, value]);

	const sliderLabel = useMemo(
		() => (
			<div className="flex items-center justify-between">
				<Label htmlFor="months-slider" className="text-sm select-none">
					Meses a mostrar: {value[0]}
				</Label>
				<InfoTooltip />
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
				{sliderLabel}

				<Slider
					id="months-slider"
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
		[sliderLabel, maxValue, value, handleValueChange, sliderDisabled, sliderRangeLabels],
	);

	if (!isPremium) {
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
