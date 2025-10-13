import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: false,
  experimental: {
    cssChunking: true,
    inlineCss: true,
    viewTransition: true,
    webVitalsAttribution: ['FCP', 'CLS', 'TTFB', 'FID', 'LCP', 'INP'],
  },
};
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();