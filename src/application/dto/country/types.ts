import type { LocalizedCountryNames } from "i18n-iso-countries";

export type RawCountry = LocalizedCountryNames<{ select: "official" }>;

export interface CountryDTO {
	value: string;
	label: string;
	flag: string;
}
