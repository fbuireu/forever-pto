export function getFlagCode(countryCode: string): string {
  if (!countryCode) return '';

  return countryCode.toLowerCase();
}
