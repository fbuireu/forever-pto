//import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/infrastructure/i18n/config/config.ts');

const nextConfig: NextConfig = {
  trailingSlash: false,
  experimental: {
    ppr: 'incremental',
    cssChunking: true,
    inlineCss: true,
    viewTransition: true,
    webVitalsAttribution: ['FCP', 'CLS', 'TTFB', 'FID', 'LCP', 'INP'],
  },
};

if (process.env.NODE_ENV === 'development') {
  // await setupDevPlatform();
}

export default withNextIntl(nextConfig);
