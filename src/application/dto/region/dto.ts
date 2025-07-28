import { BaseDTO } from '@application/shared/dto/baseDTO';
import { RawRegion, RegionDTO } from './types';

export const regionDTO: BaseDTO<RawRegion, RegionDTO[]> = {
  create: ({ raw }) => {
    return Object.entries(raw).map(([code, name]) => ({
      value: code,
      label: name,
    }));
  },
};
