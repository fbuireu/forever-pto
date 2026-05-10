import { LOCALES } from '@infrastructure/i18n/locales';
import { type AppConfig, useTranslations } from 'next-intl';

interface UseLanguagesReturn {
  code: AppConfig['Locale'];
  label: string;
}

export function useLanguages(): UseLanguagesReturn[] {
  const t = useTranslations('languages');

  return LOCALES.map((code) => ({
    code,
    label: t(code as Parameters<typeof t>[0]),
  }));
}
