import type { CountryDTO } from "@application/dto/country/types";
import type { LocalizedCountryNames } from "i18n-iso-countries";

export type RawRegion = LocalizedCountryNames<{ select: "official" }>;

export type RegionDTO = Omit<CountryDTO, "flag">;
