import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://forever-pto.com';

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
