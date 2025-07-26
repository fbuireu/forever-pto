import type { SearchParams } from "@const/types";
import { getCountries } from "@infrastructure/services/country/getCountries/getCountries";
import { getRegions } from "@infrastructure/services/region/getRegions/getRegions";
import { cache } from "react";
import { RegionsClient } from "./atoms/RegionsClient";

const getCachedCountries = cache(getCountries);
const getCachedRegions = cache(getRegions);

export interface RegionsProps {
	country: SearchParams["country"];
	region: SearchParams["region"];
}

export const Regions = async ({ country, region }: RegionsProps) => {
	const countries = await getCachedCountries();
	const userCountry = countries.find(({ value }) => value.toLowerCase() === country);
	const regions = await getCachedRegions(userCountry?.value);

	return <RegionsClient regions={regions} selectedRegion={region} userCountry={userCountry} />;
};
