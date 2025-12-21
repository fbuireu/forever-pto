import { withBetterStack } from '@logtail/next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/infrastructure/i18n/config.ts');

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
    compiler: {
      removeConsole: isProd,
    },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@libsql/client', '@libsql/isomorphic-ws'],
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default withBetterStack(withNextIntl(nextConfig));

initOpenNextCloudflareForDev();
