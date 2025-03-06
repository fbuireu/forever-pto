import { BaseDTO } from '@/shared/application/dto/baseDTO';
import { CountryDTO, RawCountry } from '@/application/dto/country/types';
import { getEmojiFlag } from './utils/getEmojiFlag';

export const countryDTO: BaseDTO<RawCountry, CountryDTO[]> = {
  create: ({ raw }) => {
    return Object.entries(raw).map(([code, name]) => ({
      value: code,
      label: name,
      flag: getEmojiFlag(code),
    }))
  }
};


