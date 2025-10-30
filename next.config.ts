import { withBetterStack } from '@logtail/next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/infrastructure/i18n/config.ts')

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  // cacheComponents: true, need rootParams to get locale in server to set next-intl (
  compiler: {
    removeConsole: isProd,
  },
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
  }
}

export default withBetterStack(withNextIntl(nextConfig))

initOpenNextCloudflareForDev()
