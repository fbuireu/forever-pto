"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import { useLocationStore } from "@application/stores/location";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { MapPin } from "@ui/modules/core/animate/icons/MapPin";
import { Combobox } from "@ui/modules/core/primitives/Combobox";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { SidebarFieldLabel } from "./SidebarFieldLabel";

interface CountriesClientProps {
	countries: CountryDTO[];
}

export const CountriesClient = ({ countries }: CountriesClientProps) => {
	const t = useTranslations("sidebar.country");
	const country = useFiltersStore((state) => state.country);
	const setCountry = useFiltersStore((state) => state.setCountry);
	const askForPlan = useHolidaysStore((state) => state.askForPlan);
	const setCountries = useLocationStore((state) => state.setCountries);

	useEffect(() => {
		if (!countries.length) return;
		setCountries(countries);
	}, [countries, setCountries]);

	const handleCountryChange = (value: string) => {
		if (value !== country) askForPlan();
		setCountry(value);
		track({ event: "planning_input_changed", properties: { input: "country", inputValue: value } });
	};

	return (
		<AnimateIcon animateOnHover asChild>
			<div className="space-y-2 w-full">
				<SidebarFieldLabel
					controlId="countries"
					icon={<MapPin size={16} />}
					title={t("title")}
					tooltip={{ label: t("tooltipLabel"), content: t("tooltip") }}
				/>
				<Combobox
					className="w-full"
					id="countries"
					options={countries}
					value={country}
					onChange={handleCountryChange}
					placeholder={t("placeholder")}
					searchPlaceholder={t("search")}
				/>
			</div>
		</AnimateIcon>
	);
};
