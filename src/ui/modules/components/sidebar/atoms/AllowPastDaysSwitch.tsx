"use client";

import type { SearchParams } from '@app/page';
import { createQueryString } from '@shared/ui/utils/createQueryString';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useState } from 'react';
import { Label } from '../../core/Label';
import { Switch } from '../../core/Switch';
import { InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../core/Tooltip';

interface AllowPastDaysSwitchProps {
	allowPastDays: SearchParams['allowPastDays'];
}

export const AllowPastDaysSwitch = ({ allowPastDays }: AllowPastDaysSwitchProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isEnabled, setIsEnabled] = useState(allowPastDays === "true");

	const handleSwitchChange = (checked: boolean) => {
		setIsEnabled(checked);

		const query = createQueryString({
			type: "allowPastDays",
			value: String(checked),
			searchParams,
		});

		startTransition(() => {
			router.push(`${pathname}?${query}`, { scroll: false });
		});
	};

	return (
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Switch
							id="allow-past-days"
							checked={isEnabled}
							onCheckedChange={handleSwitchChange}
					/>
					<Label htmlFor="allow-past-days" className="text-sm cursor-pointer select-none">
						{isEnabled ? "Activado" : "Desactivado"}
					</Label>
				</div>

				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
						</TooltipTrigger>
						<TooltipContent className="max-w-xs">
							<p>Este switch permite habilitar o deshabilitar la sugerencia de días festivos pasados para ver las oportunidades perdidas.</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
	);
};