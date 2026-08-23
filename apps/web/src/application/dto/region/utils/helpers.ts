import type { RegionDTO } from "../types";

export interface GetRegionNameParams {
	regionCode: string;
	regions: RegionDTO[];
}

export function getRegionName({ regionCode, regions }: GetRegionNameParams) {
	if (!regionCode) return "";
	const region = regions.find((r) => r.value.toLowerCase() === regionCode.toLowerCase());
	return region?.label ?? regionCode;
}
