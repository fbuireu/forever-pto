"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useServerStore } from "@application/stores/server/serverStore";
import { getCountries } from "@infrastructure/services/country/getCountries/getCountries";
import { Combobox } from "@modules/components/core/combobox/Combobox";
import { useTranslations } from "next-intl";
import { cache, useEffect, useState } from "react";

const getCachedCountries = cache(getCountries);

export const CountriesClient = () => {
	const [countries, setCountries] = useState<CountryDTO[]>([]);
	const { country, updateCountry } = useServerStore();
	const t = useTranslations("filters.countries");

	useEffect(() => {
		const loadCountries = async () => {
			const countriesData = await getCachedCountries();
			setCountries(countriesData);
		};
		loadCountries();
	}, []);

	return (
		<div>
			<Combobox
				type="country"
				options={countries}
				value={country}
				label={t("label")}
				heading={t("heading")}
				placeholder={t("placeholder")}
				searchPlaceholder={t("searchPlaceholder")}
				notFoundText={t("notFound")}
				onChange={updateCountry}
			/>
		</div>
	);
};
