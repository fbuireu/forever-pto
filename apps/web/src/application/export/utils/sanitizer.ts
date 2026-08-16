const ICS_SPECIAL_CHARS = /[\\;,]/g;
const NEWLINES = /\r\n|\r|\n/g;
const OCTET_LIMIT = 75;
const CONTINUATION = '\r\n ';

const escapeValue = (value: string) =>
  value.replace(ICS_SPECIAL_CHARS, (character) => `\\${character}`).replace(NEWLINES, String.raw`\n`);

const octets = (value: string) => new TextEncoder().encode(value).length;

const fold = (line: string) => {
  if (octets(line) <= OCTET_LIMIT) return line;

  const segments: string[] = [];
  let segment = '';
  let limit = OCTET_LIMIT;

  for (const character of line) {
    if (octets(segment + character) > limit) {
      segments.push(segment);
      segment = '';
      limit = OCTET_LIMIT - 1;
    }
    segment += character;
  }

  segments.push(segment);

  return segments.join(CONTINUATION);
};

export const contentLine = (name: string, value: string) => fold(`${name}:${escapeValue(value)}`);
