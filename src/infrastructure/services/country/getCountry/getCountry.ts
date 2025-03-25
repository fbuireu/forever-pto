import { countryDTO } from "@application/dto/country/countryDTO";
import type { CountryDTO, RawCountry } from "@application/dto/country/types";
import { getUserLanguage } from "@shared/infrastructure/services/utils/getUserLanguage/getUserLanguage";
import countries from "i18n-iso-countries";

export function getCountry(country?: string): CountryDTO | undefined {
	try {
		if (!country) return undefined;
		const [userLanguage] = getUserLanguage();
		countries.registerLocale(require(`i18n-iso-countries/langs/${userLanguage}.json`));
		const countryName = countries.getName(country.toUpperCase(), userLanguage) ?? country;
		const raw: RawCountry = { [country]: countryName };

		return countryDTO.create({ raw }).at(0);
	} catch (error) {
		return undefined;
	}
}
