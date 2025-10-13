import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const withNextIntl = createNextIntlPlugin('./src/infrastructure/i18n/config.ts');

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: isProd,
  },
  images: {
    unoptimized: true,
  },
    experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
  },
  serverExternalPackages: ['@libsql/client'],
};

export default withNextIntl(nextConfig);

initOpenNextCloudflareForDev();
