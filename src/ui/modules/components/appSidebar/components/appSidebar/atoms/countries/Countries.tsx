import type { SearchParams } from '@const/types';
import { getCountries } from '@infrastructure/services/country/getCountries/getCountries';
import { Combobox } from '@ui/modules/components/core/combobox/Combobox';

interface CountriesProps {
	country: SearchParams["country"];
}

export default async function Countries({ country }: CountriesProps) {
	const countries = getCountries();

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
}
