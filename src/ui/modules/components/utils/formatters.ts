import { getLocalizedDateFns } from '@application/i18n/localize';
import { format as dateFnsFormat } from 'date-fns';
import type { Locale } from 'next-intl';

interface FormatterParams {
  date: Date;
  locale: Locale;
  format: string;
}

export const formatDate = ({ date, locale, format }: FormatterParams): string =>
  dateFnsFormat(date, format, { locale: getLocalizedDateFns(locale) });
