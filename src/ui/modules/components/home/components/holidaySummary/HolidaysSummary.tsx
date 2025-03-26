import type { HolidayDTO } from "@application/dto/holiday/types";
import { TabsList } from "@modules/components/core/tabs/atoms/tabsList/TabsList";
import { TabsTrigger } from "@modules/components/core/tabs/atoms/tabsTrigger/TabsTrigger";
import { NationalHolidays } from "@modules/components/home/components/holidaySummary/atoms/nationalHolidays/NationalHolidays";
import { RegionalHolidays } from "@modules/components/home/components/holidaySummary/atoms/regionalHolidays/RegionalHolidays";
import { Tabs } from "@ui/modules/components/core/tabs/Tabs";
import type React from "react";

interface HolidaysSummaryProps {
	holidays: HolidayDTO[];
}

const HolidaysSummary = ({ holidays }: HolidaysSummaryProps) => {
	const nationalHolidays = holidays.filter((holiday) => !holiday.location);
	const regionalHolidays = holidays.filter((holiday) => !!holiday.location);

	return (
		<section className="mb-6">
			<Tabs defaultValue="national-holidays" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="national-holidays" disabled={!nationalHolidays.length}>
						Festivos Nacionales
					</TabsTrigger>
					<TabsTrigger value="regional-holidays" disabled={!regionalHolidays.length}>
						Festivos Regionales
					</TabsTrigger>
				</TabsList>
				<NationalHolidays nationalHolidays={nationalHolidays} />
				<RegionalHolidays regionalHolidays={regionalHolidays} />
			</Tabs>
		</section>
	);
};

export default HolidaysSummary;
