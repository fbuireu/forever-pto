import { localeAlternates, localePath } from '@infrastructure/i18n/utils/url';
import { buildMetadata } from '@infrastructure/seo/buildMetadata';
import { isIndexable } from '@infrastructure/seo/routes';
import { getPublicEnv } from '@infrastructure/services/env/getPublicEnv';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

const PATH = '/legal/terms-of-service';

interface GenerateMetadataParams {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
  const { locale } = await params;
  const [{ siteUrl: baseUrl }, t] = await Promise.all([
    getPublicEnv(),
    getTranslations({ locale, namespace: 'metadata.termsOfService' }),
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
