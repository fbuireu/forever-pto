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
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
