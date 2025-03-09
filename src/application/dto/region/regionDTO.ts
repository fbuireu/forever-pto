import type { RawRegion, RegionDTO } from '@application/dto/region/types';
import type { BaseDTO } from '@shared/application/dto/baseDTO';

export const regionDTO: BaseDTO<RawRegion, RegionDTO[]> = {
	create: ({ raw }) => {
		return Object.entries(raw).map(([code, name]) => ({
			value: code,
			label: name,
		}));
	},
};
