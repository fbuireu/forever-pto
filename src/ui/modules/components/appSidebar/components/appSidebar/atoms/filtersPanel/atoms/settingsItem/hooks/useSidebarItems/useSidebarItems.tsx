import type { SearchParams } from "@const/types";
import { AllowPastDays } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/allowPastDays/AllowPastDays";
import { AllowPasDaysInfoTooltip } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/allowPastDays/atoms/allowPasDaysInfoTooltip/AllowPasDaysInfoTooltip";
import { CarryOverMonthsTooltip } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/carryOverMonths/atoms/carryOverMonthsTooltip/CarryOverMonthsTooltip";
import { CarryOverMonths } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/carryOverMonths/CarryOverMonths";
import { Countries } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/countries/Countries";
import { PtoDays } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/PtoDays";
import { Regions } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/regions/Regions";
import { Years } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/years/Years";
import type { SidebarItem } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/types";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { Calendar, CalendarDays, MapPin, MapPinned, SlidersHorizontal, ToggleLeftIcon } from "lucide-react";
import { type Locale, useTranslations } from "next-intl";
import { Suspense, useMemo } from "react";

interface UseSidebarItemsParams extends SearchParams {
	locale: Locale;
}

const FilterSkeleton = ({ className }: { className?: string }) => {
	return <div className={mergeClasses("bg-slate-200 animate-pulse rounded-md", className)} />;
};

export function useSidebarItems(params: UseSidebarItemsParams): SidebarItem[] {
	const { country, region, ptoDays, year, allowPastDays, carryOverMonths, locale } = params;
	const t = useTranslations("filters");

	const suspenseKey = useMemo(
		() => JSON.stringify({ country, region, ptoDays, year, allowPastDays, carryOverMonths }),
		[country, region, ptoDays, year, allowPastDays, carryOverMonths],
	);

	return useMemo(
		() => [
			{
				id: "pto-days",
				title: t("days"),
				icon: CalendarDays,
				renderComponent: () => (
					<Suspense key={`pto-days-${suspenseKey}`} fallback={<FilterSkeleton />}>
						<PtoDays ptoDays={ptoDays} />
					</Suspense>
				),
			},
			{
				id: "country",
				title: t("country"),
				icon: MapPin,
				renderComponent: () => (
					<Suspense key={`country-${suspenseKey}`} fallback={<FilterSkeleton />}>
						<Countries country={country} />
					</Suspense>
				),
			},
			{
				id: "region",
				title: t("region"),
				icon: MapPinned,
				renderComponent: () => (
					<Suspense key={`region-${suspenseKey}`} fallback={<FilterSkeleton />}>
						<Regions country={country} region={region} />
					</Suspense>
				),
			},
			{
				id: "year",
				title: t("year"),
				icon: Calendar,
				renderComponent: () => (
					<Suspense key={`year-${suspenseKey}`} fallback={<FilterSkeleton />}>
						<Years year={year} />
					</Suspense>
				),
			},
			{
				id: "allow-past-days",
				title: t("allowPastDays.label"),
				icon: ToggleLeftIcon,
				renderComponent: () => (
					<Suspense key={`allow-past-days-${suspenseKey}`} fallback={<FilterSkeleton />}>
						<AllowPastDays allowPastDays={allowPastDays} />
					</Suspense>
				),
				renderTooltip: () => <AllowPasDaysInfoTooltip locale={locale} />,
			},
			{
				id: "carry-over-months",
				title: t("carryOverMonths.label"),
				icon: SlidersHorizontal,
				renderComponent: () => (
					<Suspense key={`carry-over-months-${suspenseKey}`} fallback={<FilterSkeleton className="h-20" />}>
						<CarryOverMonths carryOverMonths={carryOverMonths} />
					</Suspense>
				),
				renderTooltip: () => <CarryOverMonthsTooltip locale={locale} />,
			},
		],
		[country, region, ptoDays, year, allowPastDays, carryOverMonths, locale, t, suspenseKey],
	);
}
