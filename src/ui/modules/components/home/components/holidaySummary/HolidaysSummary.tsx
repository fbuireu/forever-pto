import { isPremium } from "@application/actions/premium";
import type { HolidayDTO } from "@application/dto/holiday/types";
import { Badge } from "@modules/components/core/badge/Badge";
import { TabsList } from "@modules/components/core/tabs/atoms/tabsList/TabsList";
import { TabsTrigger } from "@modules/components/core/tabs/atoms/tabsTrigger/TabsTrigger";
import { CustomHolidays } from "@modules/components/home/components/holidaySummary/atoms/customHolidays/CustomHolidays";
import { NationalHolidays } from "@modules/components/home/components/holidaySummary/atoms/nationalHolidays/NationalHolidays";
import { RegionalHolidays } from "@modules/components/home/components/holidaySummary/atoms/regionalHolidays/RegionalHolidays";
import { PremiumLock } from "@modules/components/premium/components/premiumLock/PremiumLock";
import { Tabs } from "@ui/modules/components/core/tabs/Tabs";
import { LockIcon } from "lucide-react";

interface HolidaysSummaryProps {
	holidays: HolidayDTO[];
}

const HolidaysSummary = async ({ holidays }: HolidaysSummaryProps) => {
	const nationalHolidays = holidays.filter((holiday) => !holiday.location);
	const regionalHolidays = holidays.filter((holiday) => !!holiday.location);
	const customHolidays: HolidayDTO[] = [];

	return (
		<section className="mb-6">
			<Tabs defaultValue="national-holidays" className="w-full">
				<TabsList className="grid w-full grid-cols-3 mb-4">
					<TabsTrigger value="national-holidays" disabled={!nationalHolidays.length} className="relative">
						Festivos Nacionales
						{nationalHolidays.length > 0 && (
							<Badge variant="outline" className="ml-2 bg-primary/10 absolute right-2">
								{nationalHolidays.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="regional-holidays" disabled={!regionalHolidays.length} className="relative">
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
						variant="minimal"
					>
						<TabsTrigger value="custom-holidays" disabled className="relative">
							<div className="flex items-center gap-2">Festivos Personalizados</div>
							{!(await isPremium()) && <LockIcon />}
						</TabsTrigger>
					</PremiumLock>
				</TabsList>
				<NationalHolidays nationalHolidays={nationalHolidays} />
				<RegionalHolidays regionalHolidays={regionalHolidays} />
				<CustomHolidays customHolidays={customHolidays} />
			</Tabs>
		</section>
	);
};

export default HolidaysSummary;
