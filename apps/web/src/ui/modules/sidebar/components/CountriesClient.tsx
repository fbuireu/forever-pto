"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useFiltersStore } from "@application/stores/filters";
import { useLocationStore } from "@application/stores/location";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { MapPin } from "@ui/modules/core/animate/icons/MapPin";
import { Combobox } from "@ui/modules/core/primitives/Combobox";
import { SidebarFieldLabel } from "@ui/modules/sidebar/components/SidebarFieldLabel";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

interface CountriesClientProps {
	countries: CountryDTO[];
}

export const CountriesClient = ({ countries }: CountriesClientProps) => {
	const t = useTranslations("sidebar.country");
	const country = useFiltersStore((state) => state.country);
	const setCountry = useFiltersStore((state) => state.setCountry);
	const setCountries = useLocationStore((state) => state.setCountries);

	useEffect(() => {
		if (!countries.length) return;
		setCountries(countries);
	}, [countries, setCountries]);

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
					onChange={setCountry}
					placeholder={t("placeholder")}
					searchPlaceholder={t("search")}
				/>
			</div>
		</AnimateIcon>
	);
};
