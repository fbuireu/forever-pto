import { getCountries } from '@/lib/services/countryService';
import Combobox from '@/components/ui/combobox';

interface CountryComboboxProps {
    selectedCountry: string;
}

export default async function CountryCombobox({ selectedCountry }: CountryComboboxProps) {
    // Esta función se ejecuta en el servidor y espera a que se resuelva
    // Esto es lo que Suspense puede manejar mientras carga
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