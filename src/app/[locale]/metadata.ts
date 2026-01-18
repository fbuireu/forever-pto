import { LOCALES } from '@infrastructure/i18n/config';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

interface GenerateMetadataParams {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL),
    keywords: t('keywords')
      .split(',')
      .map((keyword: string) => keyword.trim()),
    alternates: {
      canonical: '/',
      languages: Object.fromEntries(LOCALES.map((lang) => [lang, `/${lang}`])),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: '/',
      siteName: t('title'),
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
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
