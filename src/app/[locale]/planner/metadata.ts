import { LOCALES } from '@infrastructure/i18n/config';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

interface GenerateMetadataParams {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
  const [{ locale }, { env }] = await Promise.all([params, getCloudflareContext({ async: true })]);
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  return {
    title: t('planner.title'),
    description: t('planner.description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}/planner`,
      languages: Object.fromEntries(LOCALES.map((lang) => [lang, `/${lang}/planner`])),
    },
    openGraph: {
      title: t('planner.title'),
      description: t('planner.description'),
      url: '/planner',
      siteName: 'Forever PTO',
      locale,
      type: 'website',
      images: [
        {
          url: '/static/images/forever-pto-logo.png',
          width: 1200,
          height: 630,
          alt: t('planner.title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('planner.title'),
      description: t('planner.description'),
      images: ['/static/images/forever-pto-logo.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}
