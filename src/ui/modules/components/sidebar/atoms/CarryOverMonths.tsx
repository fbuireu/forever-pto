"use client";

import type { SearchParams } from '@app/page';
import { Label } from '@modules/components/core/Label';
import { Slider } from '@modules/components/core/Slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@modules/components/core/Tooltip';
import { PremiumLock } from '@modules/components/premium/PremiumLock';
import { createQueryString } from '@shared/ui/utils/createQueryString';
import { usePremium } from '@ui/providers/PremiumProvider';
import { InfoIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useState } from 'react';

interface CarryOverMonthsProps {
	carryOverMonths: SearchParams["carryOverMonths"];
}

export const CarryOverMonths = ({ carryOverMonths }: CarryOverMonthsProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { isPremium } = usePremium();
	const [value, setValue] = useState([Number(carryOverMonths)]);
	const maxValue = isPremium ? 12 : 1;

	const handleValueChange = (newValue: number[]) => {
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
	};

	const sliderComponent = (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label htmlFor="months-slider" className="text-sm select-none">
					Meses a mostrar: {value[0]}
				</Label>
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
			</div>

			<Slider
				id="months-slider"
				min={1}
				max={maxValue}
				step={1}
				value={value}
				onValueChange={handleValueChange}
				disabled={!isPremium && value[0] > 1}
				className="w-full"
			/>

			<div className="flex justify-between text-xs text-muted-foreground">
				<span>1 mes</span>
				<span>{maxValue} meses</span>
			</div>
		</div>
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
