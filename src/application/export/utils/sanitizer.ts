const ICS_SPECIAL_CHARS = /[\\;,]/g;
const NEWLINE = /\n/g;

export const sanitize = (str: string) => str.replace(ICS_SPECIAL_CHARS, (c) => `\\${c}`).replaceAll(NEWLINE, String.raw`\n`);
