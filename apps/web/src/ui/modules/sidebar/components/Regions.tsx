"use client";

import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import { useLocationStore } from "@application/stores/location";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { Combobox } from "@ui/modules/core/primitives/Combobox";
import { MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { SidebarFieldLabel } from "./SidebarFieldLabel";

export const Regions = () => {
	const t = useTranslations("sidebar.region");
	const regions = useLocationStore((state) => state.regions);
	const fetchRegions = useLocationStore((state) => state.fetchRegions);

	const country = useFiltersStore((state) => state.country);
	const region = useFiltersStore((state) => state.region);
	const setRegion = useFiltersStore((state) => state.setRegion);
	const askForPlan = useHolidaysStore((state) => state.askForPlan);

	useEffect(() => {
		if (!country) return;
		fetchRegions(country);
	}, [country, fetchRegions]);

	const handleRegionChange = (value: string) => {
		if (value !== region) askForPlan();
		setRegion(value);
		track({ event: "planning_input_changed", properties: { input: "region", inputValue: value } });
	};

	return (
		<div className="space-y-2 w-full">
			<SidebarFieldLabel controlId="regions" icon={<MapPinned size={16} />} title={t("title")} />
			<Combobox
				className="w-full"
				id="regions"
				options={regions}
				value={region}
				onChange={handleRegionChange}
				disabled={!country}
				placeholder={t("placeholder")}
				searchPlaceholder={t("search")}
			/>
		</div>
	);
};
