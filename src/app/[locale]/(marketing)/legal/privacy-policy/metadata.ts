import { localeAlternates, localePath } from '@infrastructure/i18n/utils/url';
import { getPublicEnv } from '@infrastructure/services/env/getPublicEnv';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

interface GenerateMetadataParams {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
  const { locale } = await params;
  const [{ siteUrl: baseUrl }, t] = await Promise.all([
    getPublicEnv(),
    getTranslations({ locale, namespace: 'metadata.privacyPolicy' }),
  ]);

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: localePath(locale, '/legal/privacy-policy'),
      languages: localeAlternates('/legal/privacy-policy'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: localePath(locale, '/legal/privacy-policy'),
      siteName: 'Forever PTO',
      locale,
      type: 'website',
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
