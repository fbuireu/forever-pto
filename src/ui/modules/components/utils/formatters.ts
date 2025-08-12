import type { Locale as DateFnsLocale } from 'date-fns';
import { format } from 'date-fns';
import type { Locale } from 'next-intl';

interface FormatterParams {
  date: Date;
  locale: Locale;
}

export const formatMonthYear = ({ date, locale }: FormatterParams): string =>
  format(date, 'LLLL yyyy', { locale: locale as unknown as DateFnsLocale });

export const formatDay = ({ date, locale }: FormatterParams): string =>
  format(date, 'd', { locale: locale as unknown as DateFnsLocale });

