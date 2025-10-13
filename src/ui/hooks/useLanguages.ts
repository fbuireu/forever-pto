import { type AppConfig, useTranslations } from 'next-intl';

interface UseLanguagesReturn {
  code: AppConfig['Locale'];
  label: string;
}

const LOCALES = ['en', 'es', 'ca', 'it'] as const;

export function useLanguages(): UseLanguagesReturn[] {
  const t = useTranslations('languages');

  return LOCALES.map((code) => ({
    code,
    label: t(code),
  }));
}
