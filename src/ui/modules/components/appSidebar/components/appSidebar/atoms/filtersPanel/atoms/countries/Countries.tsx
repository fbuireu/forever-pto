import type { SearchParams } from "@const/types";
import { getCountries } from "@infrastructure/services/country/getCountries/getCountries";
import { cache } from "react";
import { CountriesClient } from "./atoms/CountriesClient";

const getCachedCountries = cache(getCountries);

export interface CountriesProps {
	country: SearchParams["country"];
}

export const Countries = async ({ country }: CountriesProps) => {
	const countries = await getCachedCountries();

	return <CountriesClient countries={countries} selectedCountry={country} />;
};
