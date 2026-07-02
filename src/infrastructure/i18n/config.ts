import ca from '@i18n/messages/ca.json';
import de from '@i18n/messages/de.json';
import en from '@i18n/messages/en.json';
import es from '@i18n/messages/es.json';
import fr from '@i18n/messages/fr.json';
import it from '@i18n/messages/it.json';
import { routing } from '@infrastructure/i18n/routing';
import { type AbstractIntlMessages, hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { LOCALES } from './locales';

export { LOCALES } from './locales';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

const MESSAGES: Record<string, AbstractIntlMessages> = { ca, de, en, es, fr, it };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(LOCALES, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: MESSAGES[locale],
  };
});
