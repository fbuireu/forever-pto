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
    const regions = countryData ? await getRegions(countryData.label) : [];
    const isDisabled = !countryData || !regions?.length;

    console.log('selected', selectedRegion);
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