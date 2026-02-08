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
  const t = await getTranslations({ locale, namespace: 'metadata.cookiePolicy' });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: '/legal/cookie-policy',
      languages: Object.fromEntries(LOCALES.map((lang) => [lang, `/${lang}/legal/cookie-policy`])),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: '/legal/cookie-policy',
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
