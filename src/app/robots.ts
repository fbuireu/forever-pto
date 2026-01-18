import { getCloudflareContext } from '@opennextjs/cloudflare';
import { MetadataRoute } from 'next';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { env } = await getCloudflareContext({ async: true });
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
