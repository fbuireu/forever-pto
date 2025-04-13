"use client";

import { useHolidaysStore } from "@application/stores/holidays/holidaysStore";
import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { Badge } from "@modules/components/core/badge/Badge";
import { TabsList } from "@modules/components/core/tabs/atoms/tabsList/TabsList";
import { TabsTrigger } from "@modules/components/core/tabs/atoms/tabsTrigger/TabsTrigger";
import { HolidaysTable } from "@modules/components/home/components/holidaySummary/atoms/holidaysTable/HolidaysTable";
import { HolidayTabVariant } from "@modules/components/home/components/holidaySummary/types";
import { PremiumLock } from "@modules/components/premium/components/premiumLock/PremiumLock";
import { Tabs } from "@ui/modules/components/core/tabs/Tabs";

const HolidaysSummary = () => {
	const effectiveHolidays = useHolidaysStore((state) => state.effectiveHolidays);
	const { isPremiumUser } = usePremiumStore();

	const nationalHolidays = effectiveHolidays.filter(({ variant }) => variant === "national");
	const regionalHolidays = effectiveHolidays.filter(({ variant }) => variant === "regional");
	const customHolidays = effectiveHolidays.filter(({ variant }) => variant === "custom");

	return (
		<section className="mb-6">
			<Tabs defaultValue="national-holidays" className="w-full">
				<TabsList className="grid w-full grid-cols-3 mb-4">
					<TabsTrigger
						value={HolidayTabVariant.nationalHolidays}
						disabled={!nationalHolidays.length}
						className="relative"
					>
						Festivos Nacionales
						{nationalHolidays.length > 0 && (
							<Badge variant="outline" className="ml-2 bg-primary/10 absolute right-2">
								{nationalHolidays.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger
						value={HolidayTabVariant.regionalHolidays}
						disabled={!regionalHolidays.length}
						className="relative"
					>
						Festivos Regionales
						{regionalHolidays.length > 0 && (
							<Badge variant="outline" className="ml-2 bg-primary/10 absolute right-2">
								{regionalHolidays.length}
							</Badge>
						)}
					</TabsTrigger>
					<PremiumLock
						featureName="Selección múltiple"
						description="Para poder seleccionar múltiples festivos, necesitas una suscripción premium."
						variant="stacked"
					>
						<TabsTrigger value={HolidayTabVariant.customHolidays} disabled={!isPremiumUser} className="relative">
							<div className="flex items-center gap-2">Festivos Personalizados</div>
						</TabsTrigger>
					</PremiumLock>
				</TabsList>
				<HolidaysTable
					holidays={nationalHolidays}
					title="Festivos Nacionales"
					tabValue={HolidayTabVariant.nationalHolidays}
				/>
				<HolidaysTable
					holidays={regionalHolidays}
					title="Festivos Regionales"
					tabValue={HolidayTabVariant.regionalHolidays}
				/>
				<HolidaysTable
					holidays={customHolidays}
					title="Festivos Personalizados"
					tabValue={HolidayTabVariant.customHolidays}
				/>
			</Tabs>
		</section>
	);
};

export default HolidaysSummary;
