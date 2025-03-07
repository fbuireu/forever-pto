import Holidays from 'date-holidays';

interface GetRegionNameParams {
  regionCode: string;
  countryCode: string;
}

const REGIONS_CACHE: Record<string, Record<string, string>> = {};

export function getRegionsMap(countryCode: string): Record<string, string> {
  if (REGIONS_CACHE[countryCode]) {
    return REGIONS_CACHE[countryCode];
  }

  REGIONS_CACHE[countryCode] = {};

  try {
    const holidays = new Holidays();
    const regions = holidays.getStates(countryCode);

    for (const [code, name] of Object.entries(regions)) {
      REGIONS_CACHE[countryCode][code.toLowerCase()] = name as string;
    }
  } catch (error) {
    console.error(`Error al cargar regiones para ${countryCode}:`, error);
  }

  return REGIONS_CACHE[countryCode];
}

export function getRegionName({ regionCode, countryCode }: GetRegionNameParams): string {
  if (!regionCode) return '';

  const regionsMap = getRegionsMap(countryCode);
  const regionName = regionsMap[regionCode.toLowerCase()];

  return regionName || regionCode;
}