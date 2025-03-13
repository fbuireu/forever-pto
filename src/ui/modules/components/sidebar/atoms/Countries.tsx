import type { SearchParams } from '@app/page';
import { getCountries } from '@infrastructure/services/country/getCountries';
import { Combobox } from '@modules/components/core/Combobox';

interface CountryComboboxProps {
	country: SearchParams["country"];
}

export default async function Countries({ country }: CountryComboboxProps) {
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
