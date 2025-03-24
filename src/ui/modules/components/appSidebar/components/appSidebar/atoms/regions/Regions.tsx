import type { SearchParams } from '@const/types';
import { getCountries } from '@infrastructure/services/country/getCountries/getCountries';
import { getRegions } from '@infrastructure/services/region/getRegions/getRegions';
import { Combobox } from '@ui/modules/components/core/combobox/Combobox';
import { cache } from 'react';

const getCachedCountries = cache(getCountries);
const getCachedRegions = cache(getRegions);

interface RegionProps {
	country: SearchParams["country"];
	region: SearchParams["region"];
}

export const Regions = async ({ country, region }: RegionProps) => {
	const countries = getCachedCountries();
	const userCountry = countries.find(({ value }) => value.toLowerCase() === country);
	const regions = await getCachedRegions(userCountry?.value);
	const isDisabled = !userCountry || !regions?.length;

	return (
		<Combobox
			value={region}
			options={regions}
			label="Region"
			heading={userCountry?.label ? `Regiones en ${userCountry.label}` : ""}
			type="region"
			disabled={isDisabled}
			placeholder={regions.length ? "Selecciona región..." : `No regions found for ${userCountry?.label ?? ""}`}
			searchPlaceholder="Buscar región..."
			notFoundText="Región no encontrada."
			className="w-full"
		/>
	);
};
