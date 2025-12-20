import { withBetterStack } from '@logtail/next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/infrastructure/i18n/config.ts');

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  //   compiler: {
  //     removeConsole: false,
  //   },
  productionBrowserSourceMaps: true, // Habilita source maps en producción
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    '@libsql/client',
    '@libsql/hrana-client',
    '@libsql/isomorphic-ws',
    '@libsql/isomorphic-fetch',
  ],
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackMinify: false,
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['*'],
    },
  },
};

export default withBetterStack(withNextIntl(nextConfig));

initOpenNextCloudflareForDev();
