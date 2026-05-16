import { localeAlternates, localePath } from '@infrastructure/i18n/utils/url';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

interface GenerateMetadataParams {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
  const { locale } = await params;
  const [{ env }, t] = await Promise.all([
    getCloudflareContext({ async: true }),
    getTranslations({ locale, namespace: 'metadata.legalNotice' }),
  ]);
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: localePath(locale, '/legal/legal-notice'),
      languages: localeAlternates('/legal/legal-notice'),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: localePath(locale, '/legal/legal-notice'),
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
