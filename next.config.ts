import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/infrastructure/i18n/config/config.ts');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  experimental: {
    cssChunking: true,
    inlineCss: true,
    viewTransition: true,
    webVitalsAttribution: ['FCP', 'CLS', 'TTFB', 'FID', 'LCP', 'INP'],
  },
};

export default withNextIntl(nextConfig);
