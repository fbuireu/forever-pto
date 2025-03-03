import Combobox from '@/components/ui/combobox';
import { getCountries } from '@/infrastructure/services/country';

interface CountryComboboxProps {
    selectedCountry: string;
}

export default async function CountryCombobox({ selectedCountry }: CountryComboboxProps) {
    const countries = await getCountries();
    return (
            <Combobox
                    value={selectedCountry}
                    options={countries}
                    label="País"
                    placeholder="Selecciona país..."
                    searchPlaceholder="Buscar país..."
                    notFoundText="País no encontrado."
                    type="country"
                    className="w-full"
            />
    );
}