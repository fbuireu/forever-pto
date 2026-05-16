import { LOCALES } from '@infrastructure/i18n/locales';
import { useTranslations } from 'next-intl';

export function useLanguages() {
  const t = useTranslations('languages');

  return LOCALES.map((code) => ({
    code,
    label: t(code as Parameters<typeof t>[0]),
  }));
}
