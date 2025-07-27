"use client";

import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import { useServerStore } from "@application/stores/server/serverStore";
import { getCountries } from "@infrastructure/services/country/getCountries/getCountries";
import { getRegions } from "@infrastructure/services/region/getRegions/getRegions";
import { Combobox } from "@modules/components/core/combobox/Combobox";
import { useTranslations } from "next-intl";
import { cache, useEffect, useState } from "react";

const getCachedCountries = cache(getCountries);
const getCachedRegions = cache(getRegions);

export const RegionsClient = () => {
	const { country, region, updateRegion } = useServerStore();
	const t = useTranslations("filters.regions");
	const [regions, setRegions] = useState<RegionDTO[]>([]);
	const [currentUserCountry, setCurrentUserCountry] = useState<CountryDTO | null>(null);

	useEffect(() => {
		const loadData = async () => {
			const countries = await getCachedCountries();
			const userCountry = countries.find(({ value }) => value.toLowerCase() === country);
			const regionsData = await getCachedRegions(userCountry?.value);

			setCurrentUserCountry(userCountry || null);
			setRegions(regionsData);
		};
		loadData();
	}, [country]);

	const isDisabled = !currentUserCountry || !regions?.length;

	return (
		<div>
			<Combobox
				type="region"
				value={region}
				options={regions}
				disabled={isDisabled}
				className="w-full"
				label={t("label")}
				heading={t("heading", {
					hasCountry: currentUserCountry?.label ? 1 : 0,
					country: currentUserCountry?.label ?? "",
				})}
				placeholder={t("placeholder", {
					count: regions.length,
					country: currentUserCountry?.label ?? "",
				})}
				searchPlaceholder={t("searchPlaceholder")}
				notFoundText={t("notFound")}
				onChange={updateRegion}
			/>
		</div>
	);
};
