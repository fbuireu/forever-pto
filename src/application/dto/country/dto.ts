import type { CountryDTO, RawCountry } from '@application/dto/country/types';
import { getEmojiFlag } from './utils/getEmogiFlag';
import type { BaseDTO } from '@application/shared/dto/baseDTO';

export const countryDTO: BaseDTO<RawCountry, CountryDTO[]> = {
  create: ({ raw }) => {
    return Object.entries(raw).map(([code, name]) => ({
      value: code,
      label: name,
      flag: getEmojiFlag(code),
    }));
  },
};
