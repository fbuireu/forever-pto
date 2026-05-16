const REGIONAL_INDICATOR_SYMBOL_OFFSET = 127397;

export function getEmojiFlag(countryCode: string) {
  if (!countryCode) return '';

  return Array.from(countryCode.toUpperCase())
    .map((letter) => String.fromCodePoint(REGIONAL_INDICATOR_SYMBOL_OFFSET + letter.charCodeAt(0)))
    .join('');
}
