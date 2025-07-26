"use client";

import { useHolidaysStore } from "@application/stores/holidays/holidaysStore";
import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { TabsList } from "@modules/components/core/tabs/atoms/tabsList/TabsList";
import { TabsTrigger } from "@modules/components/core/tabs/atoms/tabsTrigger/TabsTrigger";
import { HolidaysTable } from "@modules/components/home/components/holidaySummary/atoms/holidaysTable/HolidaysTable";
import { HolidayTabVariant } from "@modules/components/home/components/holidaySummary/types";
import { PremiumLock } from "@modules/components/premium/components/premiumLock/PremiumLock";
import { Tabs } from "@ui/modules/components/core/tabs/Tabs";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { useTranslations } from "next-intl";

const HolidaysSummary = () => {
	const effectiveHolidays = useHolidaysStore((state) => state.effectiveHolidays);
	const { isPremiumUser } = usePremiumStore();
	const t = useTranslations("holidaysSummary");

	const nationalHolidays = effectiveHolidays.filter(({ variant }) => variant === "national");
	const regionalHolidays = effectiveHolidays.filter(({ variant }) => variant === "regional");
	const customHolidays = effectiveHolidays.filter(({ variant }) => variant === "custom");

	return (
		<section className="mb-6">
			<Tabs defaultValue={HolidayTabVariant.nationalHolidays} className="w-full">
				<TabsList className="grid w-full grid-cols-3 mb-4">
					<TabsTrigger
						value={HolidayTabVariant.nationalHolidays}
						disabled={!nationalHolidays.length}
						className="flex flex-col items-center gap-1 py-2"
					>
						<span>{t("national")}</span>
					</TabsTrigger>
					<TabsTrigger
						value={HolidayTabVariant.regionalHolidays}
						disabled={!regionalHolidays.length}
						className="flex flex-col items-center gap-1 py-2"
					>
						<span>{t("regional")}</span>
					</TabsTrigger>
					<PremiumLock featureName={t("featureName")} featureDescription={t("featureDescription")} variant="stacked">
						<TabsTrigger
							value={HolidayTabVariant.customHolidays}
							disabled={!isPremiumUser}
							className={mergeClasses(
								"relative",
								!isPremiumUser && "opacity-50 data-[state=active]:opacity-50 shadow-none pointer-events-none",
							)}
						>
							<div className="flex items-center gap-2">{t("custom")}</div>
						</TabsTrigger>
					</PremiumLock>
				</TabsList>
				<HolidaysTable
					holidays={nationalHolidays}
					title={t("national")}
					tabValue={HolidayTabVariant.nationalHolidays}
				/>
				<HolidaysTable
					holidays={regionalHolidays}
					title={t("regional")}
					tabValue={HolidayTabVariant.regionalHolidays}
				/>
				<HolidaysTable holidays={customHolidays} title={t("custom")} tabValue={HolidayTabVariant.customHolidays} />
			</Tabs>
		</section>
	);
};

export default HolidaysSummary;
