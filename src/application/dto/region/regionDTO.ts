import { BaseDTO } from '@/shared/application/dto/baseDTO';
import { RawRegion, RegionDTO } from '@/application/dto/region/types';

export const regionDTO: BaseDTO<RawRegion, RegionDTO[]> = {
  create: ({ raw }) => {
    return Object.entries(raw).map(([code, name]) => ({
      value: code,
      label: name,
    }))
  }
};


