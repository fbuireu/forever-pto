import type { CountryDTO } from "@application/dto/country/types";
import type { Except } from "@const/types";
import type { LocalizedCountryNames } from "i18n-iso-countries";

export type RawRegion = LocalizedCountryNames<{ select: "official" }>;

export type RegionDTO = Except<CountryDTO, "flag">;
