import { Combobox } from '@/components/ui/combobox';
import { getCountries } from '@/infrastructure/services/country/getCountries';
import { getRegions } from '@/infrastructure/services/regions/getRegions';
import { SearchParams } from '@/app/page';

interface RegionComboboxProps {
    country: SearchParams['country'];
    region: SearchParams['region'];
}

export default async function RegionCombobox({
    country,
    region,
}: RegionComboboxProps) {
    const countries = getCountries()
    const userCountry = countries.find(({ value }) => value.toLowerCase() === country);
    const regions = await getRegions(userCountry?.value);
    const isDisabled = !userCountry || !regions?.length;

    return (
            <Combobox
                    value={region}
                    options={regions}
                    label="Region"
                    heading={`Regiones en ${userCountry!.label}`}
                    type="region"
                    disabled={isDisabled}
                    placeholder={regions.length ? `Selecciona región...`: `No se han encontrado regiones para ${userCountry!.label}`}
                    searchPlaceholder="Buscar región..."
                    notFoundText="Región no encontrada."
                    className="w-full"
            />
    );
}