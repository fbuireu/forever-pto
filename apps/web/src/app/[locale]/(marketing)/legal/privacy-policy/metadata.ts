import { buildMetadata } from '@infrastructure/seo/buildMetadata';
import { getPublicEnv } from '@infrastructure/services/env/getPublicEnv';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

const PATH = '/legal/privacy-policy';

interface GenerateMetadataParams {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
  const { locale } = await params;
  const [{ siteUrl: baseUrl }, t] = await Promise.all([
    getPublicEnv(),
    getTranslations({ locale, namespace: 'metadata.privacyPolicy' }),
  ]);

  return buildMetadata({
    baseUrl,
    locale,
    route: PATH,
    title: t('title'),
    description: t('description'),
  });
}
