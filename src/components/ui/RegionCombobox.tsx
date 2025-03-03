import Combobox from '@/components/ui/combobox';
import { getCountries } from '@/infrastructure/services/country';
import { getRegions } from '@/infrastructure/services/regions';

interface RegionComboboxProps {
    selectedCountry: string;
    selectedRegion: string;
}

export default async function RegionCombobox({
    selectedCountry,
    selectedRegion,
}: RegionComboboxProps) {
    const countries = await getCountries();
    const countryData = countries.find(c => c.value.toLowerCase() === selectedCountry);
    const regions = countryData ? await getRegions(countryData.value) : [];
    const isDisabled = !countryData || !regions?.length;

    return (
            <Combobox
                    value={selectedRegion}
                    options={regions}
                    label="Region"
                    type="region"
                    disabled={isDisabled}
                    placeholder="Selecciona región..."
                    searchPlaceholder="Buscar región..."
                    notFoundText="Región no encontrada."
                    className="w-full"
            />
    );
}