import { withBetterStack } from '@logtail/next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/infrastructure/i18n/config.ts',
  experimental: {
    messages: {
      path: './src/ui/i18n/messages',
      locales: 'infer',
      format: 'json',
      precompile: true,
    },
  },
});

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
