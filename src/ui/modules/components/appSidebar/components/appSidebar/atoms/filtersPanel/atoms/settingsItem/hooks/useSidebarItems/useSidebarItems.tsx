import { useServerStore } from "@application/stores/server/serverStore";
import { AllowPastDays } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/allowPastDays/AllowPastDays";
import { AllowPasDaysInfoTooltip } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/allowPastDays/atoms/allowPasDaysInfoTooltip/AllowPasDaysInfoTooltip";
import { CarryOverMonthsTooltip } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/carryOverMonths/atoms/carryOverMonthsTooltip/CarryOverMonthsTooltip";
import { CarryOverMonths } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/carryOverMonths/CarryOverMonths";
import { CountriesClient } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/countries/CountriesClient";
import { PtoDays } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/PtoDays";
import { RegionsClient } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/regions/RegionsClient";
import { Years } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/years/Years";
import type { SidebarItem } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/types";
import { Calendar, CalendarDays, MapPin, MapPinned, SlidersHorizontal, ToggleLeftIcon } from "lucide-react";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface UseSidebarItemsParams {
	locale: Locale;
}

export function useSidebarItems(params: UseSidebarItemsParams): SidebarItem[] {
	const { locale } = params;
	const t = useTranslations("filters");
	const { carryOverMonths } = useServerStore();
	return useMemo(
		() => [
			{
				id: "pto-days",
				title: t("days"),
				icon: CalendarDays,
				renderComponent: () => <PtoDays />,
			},
			{
				id: "country",
				title: t("country"),
				icon: MapPin,
				renderComponent: () => <CountriesClient />,
			},
			{
				id: "region",
				title: t("region"),
				icon: MapPinned,
				renderComponent: () => <RegionsClient />,
			},
			{
				id: "year",
				title: t("year"),
				icon: Calendar,
				renderComponent: () => <Years />,
			},
			{
				id: "allow-past-days",
				title: t("allowPastDays.label"),
				icon: ToggleLeftIcon,
				renderComponent: () => <AllowPastDays />,
				renderTooltip: () => <AllowPasDaysInfoTooltip locale={locale} />,
			},
			{
				id: "carry-over-months",
				title: t("carryOverMonths.label"),
				icon: SlidersHorizontal,
				renderComponent: () => <CarryOverMonths carryOverMonths={carryOverMonths} />,
				renderTooltip: () => <CarryOverMonthsTooltip locale={locale} />,
			},
		],
		[locale, t, carryOverMonths],
	);
}
