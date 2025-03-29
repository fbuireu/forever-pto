import type { SearchParams } from "@const/types";
import { getCountries } from "@infrastructure/services/country/getCountries/getCountries";
import { Combobox } from "@ui/modules/components/core/combobox/Combobox";
import { cache, memo } from "react";

export interface CountriesProps {
	country: SearchParams["country"];
}

const getCachedCountries = cache(getCountries);

export const Countries = memo(({ country }: CountriesProps) => {
	const countries = getCachedCountries();

	return (
		<Combobox
			value={country}
			options={countries}
			label="País"
			heading="Paises"
			placeholder="Selecciona país..."
			searchPlaceholder="Buscar país..."
			notFoundText="País no encontrado."
			type="country"
			className="w-full"
		/>
	);
});
