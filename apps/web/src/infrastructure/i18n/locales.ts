export const CA = 'ca';
export const IT = 'it';
export const EN = 'en';
export const ES = 'es';
export const FR = 'fr';
export const DE = 'de';

export const LOCALES = [CA, IT, EN, ES, FR, DE] as const;

export type LocaleCode = (typeof LOCALES)[number];

export const isLocale = (value: string): value is LocaleCode => (LOCALES as readonly string[]).includes(value);

export const LOCALE_COOKIE = 'NEXT_LOCALE';
