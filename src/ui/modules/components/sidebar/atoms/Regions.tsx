import type { SearchParams } from '@app/page';
import { getCountries } from '@infrastructure/services/country/getCountries';
import { getRegions } from '@infrastructure/services/regions/getRegions';
import { Combobox } from '@modules/components/core/Combobox';

interface RegionProps {
	country: SearchParams["country"];
	region: SearchParams["region"];
}

export default async function Regions({ country, region }: RegionProps) {
	const countries = getCountries();
	const userCountry = countries.find(({ value }) => value.toLowerCase() === country);
	const regions = await getRegions(userCountry?.value);
	const isDisabled = !userCountry || !regions?.length;

	return (
		<Combobox
			value={region}
			options={regions}
			label="Region"
			heading={userCountry?.label ? `Regiones en ${userCountry.label}` : ""}
			type="region"
			disabled={isDisabled}
			placeholder={
				regions.length ? "Selecciona región..." : `No se han encontrado regiones para ${userCountry?.label ?? ""}`
			}
			searchPlaceholder="Buscar región..."
			notFoundText="Región no encontrada."
			className="w-full"
		/>
	);
}
