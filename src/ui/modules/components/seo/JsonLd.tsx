import { LOCALES } from '@infrastructure/i18n/config';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

interface JsonLdProps {
  locale: Locale;
}

export async function JsonLd({ locale }: JsonLdProps) {
  const [{ env }, t, tFaq] = await Promise.all([
    getCloudflareContext({ async: true }),
    getTranslations({ locale, namespace: 'metadata' }),
    getTranslations({ locale, namespace: 'faq' }),
  ]);

  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t('title'),
    description: t('description'),
    url: `${baseUrl}/${locale}`,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    availableLanguage: LOCALES,
    inLanguage: locale,
    image: `${baseUrl}/static/images/forever-pto-logo.png`,
    screenshot: `${baseUrl}/static/images/forever-pto-logo.png`,
    softwareVersion: '1.0',
    author: {
      '@type': 'Organization',
      name: 'Forever PTO',
      url: baseUrl,
    },
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Free version with PTO optimization, calendar visualization, and basic metrics',
      },
      {
        '@type': 'Offer',
        price: '4.99',
        priceCurrency: 'EUR',
        description: 'Premium lifetime access with advanced metrics, charts, and multiple strategies',
      },
    ],
    featureList: [
      'PTO optimization algorithms',
      'Interactive calendar visualization',
      'Public holiday integration',
      'Multiple optimization strategies',
      'Advanced metrics and charts',
      'Multi-language support',
    ],
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Forever PTO',
    url: baseUrl,
    logo: `${baseUrl}/static/images/forever-pto-logo.png`,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: tFaq('sections.general.whatIs.question'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tFaq('sections.general.whatIs.answer'),
        },
      },
      {
        '@type': 'Question',
        name: tFaq('sections.general.whyNotSeeingCountry.question'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tFaq('sections.general.whyNotSeeingCountry.answer'),
        },
      },
      {
        '@type': 'Question',
        name: tFaq('sections.general.pricing.question'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tFaq('sections.general.pricing.answer'),
        },
      },
      {
        '@type': 'Question',
        name: tFaq('sections.technical.algorithms.question'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tFaq('sections.technical.algorithms.answer'),
        },
      },
      {
        '@type': 'Question',
        name: tFaq('sections.technical.strategies.question'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tFaq('sections.technical.strategies.answer'),
        },
      },
      {
        '@type': 'Question',
        name: tFaq('sections.security.data.question'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tFaq('sections.security.data.answer'),
        },
      },
      {
        '@type': 'Question',
        name: tFaq('sections.security.encryption.question'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tFaq('sections.security.encryption.answer'),
        },
      },
      {
        '@type': 'Question',
        name: tFaq('sections.collaborate.code.question'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tFaq('sections.collaborate.code.answer'),
        },
      },
      {
        '@type': 'Question',
        name: tFaq('sections.collaborate.business.question'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tFaq('sections.collaborate.business.answer'),
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
