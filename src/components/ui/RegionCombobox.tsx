import { getCountries, getRegions } from '@/lib/services/countryService';
import Combobox from '@/components/ui/combobox';

interface RegionComboboxProps {
    selectedCountry: string;
    selectedRegion: string;
}

export default async function RegionCombobox({
    selectedCountry,
    selectedRegion,
}: RegionComboboxProps) {
    const countries = await getCountries();
    const countryData = countries.find(c => c.value === selectedCountry);

    if (!countryData) {
        return;
    }

    const regions = await getRegions(countryData.label);
    return (
            <Combobox
                    value={selectedRegion}
                    options={regions}
                    label="Region"
                    type="region"
                    disabled={!regions?.length}
                    placeholder="Selecciona región..."
                    searchPlaceholder="Buscar región..."
                    notFoundText="Región no encontrada."
                    className="w-full"
            />
    );
}