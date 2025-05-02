import { getUserLocale } from "@application/actions/language";
import { countryDTO } from "@application/dto/country/countryDTO";
import type { CountryDTO } from "@application/dto/country/types";
import { getUserLanguage } from "@shared/infrastructure/services/utils/getUserLanguage/getUserLanguage";
import countries from "i18n-iso-countries";

export async function getCountries(): Promise<CountryDTO[]> {
	try {
		const userLanguage = (await getUserLocale()) ?? getUserLanguage()[0];

		return countryDTO.create({ raw: countries.getNames(userLanguage) }).sort((a, b) => a.label.localeCompare(b.label));
	} catch (error) {
		return [];
	}
}
