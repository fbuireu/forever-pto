import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/infrastructure/i18n/config.ts');

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  trailingSlash: false,
  compiler: {
    removeConsole: isProd,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [],
  },
};

export default withNextIntl(nextConfig);
