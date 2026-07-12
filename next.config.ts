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

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://betterstack.net https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://*.stripe.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://www.google.com/ads/ https://api.stripe.com https://r.stripe.com https://q.stripe.com https://m.stripe.com https://betterstack.net https://in.logtail.com https://telemetry.betterstack.com https://*.betterstackdata.com",
  'frame-src https://js.stripe.com https://hooks.stripe.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: CSP,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  // partialPrefetching: true, // requires Next 16.3
  compiler: {
    removeConsole: isProd,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ];
  },
  images: {
    loader: 'custom',
    loaderFile: './src/infrastructure/images/loader.ts',
  },
  transpilePackages: ['prettier'],
  experimental: {
    globalNotFound: true,
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'motion',
      '@base-ui/react',
      'cmdk',
      'sonner',
      'canvas-confetti',
    ],
  },
};

export default withBetterStack(withNextIntl(nextConfig));

initOpenNextCloudflareForDev();
