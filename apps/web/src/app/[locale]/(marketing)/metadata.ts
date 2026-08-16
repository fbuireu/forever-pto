import { buildMetadata } from '@infrastructure/seo/buildMetadata';
import { getPublicEnv } from '@infrastructure/services/env/getPublicEnv';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

const HOME_PATH = '';

interface GenerateMetadataParams {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
  const { locale } = await params;
  const [{ siteUrl: baseUrl }, t] = await Promise.all([
    getPublicEnv(),
    getTranslations({ locale, namespace: 'metadata' }),
  ]);

  return buildMetadata({
    baseUrl,
    locale,
    route: HOME_PATH,
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
  });
}
