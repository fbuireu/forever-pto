import { buildMetadata } from '@infrastructure/seo/buildMetadata';
import { isIndexable } from '@infrastructure/seo/routes';
import { getPublicEnv } from '@infrastructure/services/env/getPublicEnv';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

const PATH = '/legal/legal-notice';

interface GenerateMetadataParams {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
  const { locale } = await params;
  const [{ siteUrl: baseUrl }, t] = await Promise.all([
    getPublicEnv(),
    getTranslations({ locale, namespace: 'metadata.legalNotice' }),
  ]);

  return buildMetadata({
    baseUrl,
    locale,
    path: PATH,
    title: t('title'),
    description: t('description'),
    indexable: isIndexable(PATH),
  });
}
