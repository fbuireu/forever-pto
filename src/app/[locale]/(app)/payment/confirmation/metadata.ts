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
    getTranslations({ locale, namespace: 'metadata.paymentConfirmation' }),
  ]);

  return {
    title: t('title'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: localePath(locale, '/payment/confirmation'),
      languages: localeAlternates('/payment/confirmation'),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
