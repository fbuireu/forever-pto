import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";

export function hasFlag(option: CountryDTO | RegionDTO): option is CountryDTO {
	return "flag" in option && !!option.flag;
}
