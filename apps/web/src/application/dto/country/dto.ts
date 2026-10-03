import type { BaseDTO } from "@application/shared/dto/baseDTO";
import type { CountryDTO, RawCountry } from "./types";

export const countryDTO: BaseDTO<RawCountry, CountryDTO[]> = {
	create: ({ raw }) => {
		return Object.entries(raw).map(([code, name]) => ({
			value: code,
			label: name,
			flag: code.toLowerCase(),
		}));
	},
};
