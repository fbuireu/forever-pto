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
  transpilePackages: ['prettier'],
};

export default withBetterStack(withNextIntl(nextConfig));

initOpenNextCloudflareForDev();
