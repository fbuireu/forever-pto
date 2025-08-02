import { useLocationStore } from '@application/stores/location';

export function getRegionName(regionCode: string): string {
  if (!regionCode) return '';

  const regions = useLocationStore.getState().regions;

  const region = regions.find((r) => r.value.toLowerCase() === regionCode.toLowerCase());

  return region?.label || regionCode;
}
