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
    getTranslations({ locale, namespace: 'metadata' }),
  ]);

  return {
    title: t('planner.title'),
    description: t('planner.description'),
    keywords: t('keywords'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: localePath(locale, '/planner'),
      languages: localeAlternates('/planner'),
    },
    openGraph: {
      title: t('planner.title'),
      description: t('planner.description'),
      url: localePath(locale, '/planner'),
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
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}
