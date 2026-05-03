import { NotFoundContent } from '@ui/modules/pages/not-found/NotFoundContent';
import { getLocale } from 'next-intl/server';

export default async function NotFound() {
  const locale = await getLocale();

  return <NotFoundContent locale={locale} />;
}
