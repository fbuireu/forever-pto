import type { SearchParams } from "@const/types";
import { AllowPastDays } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/allowPastDays/AllowPastDays";
import { AllowPasDaysInfoTooltip } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/allowPastDays/atoms/allowPasDaysInfoTooltip/AllowPasDaysInfoTooltip";
import { CarryOverMonths } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/carryOverMonths/CarryOverMonths";
import { CarryOverMonthsTooltip } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/carryOverMonths/atoms/carryOverMonthsTooltip/CarryOverMonthsTooltip";
import { Countries } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/countries/Countries";
import { PtoDays } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/PtoDays";
import { Regions } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/regions/Regions";
import { Years } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/years/Years";
import type { SidebarItem } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/types";
import { Calendar, CalendarDays, MapPin, MapPinned, SlidersHorizontal, ToggleLeftIcon } from "lucide-react";
import { type Locale, useTranslations } from "next-intl";
import { useMemo } from "react";

interface UseSidebarItemsParams extends SearchParams {
	locale: Locale;
}

export function useSidebarItems(params: UseSidebarItemsParams): SidebarItem[] {
	const { country, region, ptoDays, year, allowPastDays, carryOverMonths, locale } = params;
	const t = useTranslations("filters");

	return useMemo(
		() => [
			{
				id: "pto-days",
				title: t("ptoDays"),
				icon: CalendarDays,
				renderComponent: () => <PtoDays ptoDays={ptoDays} />,
			},
			{
				id: "country",
				title: t("country"),
				icon: MapPin,
				renderComponent: () => <Countries country={country} locale={locale} />,
			},
			{
				id: "region",
				title: t("region"),
				icon: MapPinned,
				renderComponent: () => <Regions country={country} region={region} locale={locale} />,
			},
			{
				id: "year",
				title: t("year"),
				icon: Calendar,
				renderComponent: () => <Years year={year} />,
			},
			{
				id: "allow-past-days",
				title: t("allowPastDays"),
				icon: ToggleLeftIcon,
				renderComponent: () => <AllowPastDays allowPastDays={allowPastDays} />,
				renderTooltip: () => <AllowPasDaysInfoTooltip locale={locale} />,
			},
			{
				id: "carry-over-months",
				title: t("carryOverMonths"),
				icon: SlidersHorizontal,
				renderComponent: () => <CarryOverMonths carryOverMonths={carryOverMonths} />,
				renderTooltip: () => <CarryOverMonthsTooltip locale={locale} />,
			},
		],
		[country, region, ptoDays, year, allowPastDays, carryOverMonths, locale, t],
	);
}
