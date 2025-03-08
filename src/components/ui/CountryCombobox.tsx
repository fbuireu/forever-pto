import type { SearchParams } from "@/app/page";
import { Combobox } from "@/components/ui/combobox";
import { getCountries } from "@/infrastructure/services/country/getCountries";

interface CountryComboboxProps {
	country: SearchParams["country"];
}

export default async function CountryCombobox({ country }: CountryComboboxProps) {
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
