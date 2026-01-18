import { getCloudflareContext } from '@opennextjs/cloudflare';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const { env } = getCloudflareContext();
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/*/legal/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
