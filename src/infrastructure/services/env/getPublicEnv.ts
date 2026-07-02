import { getCloudflareContext } from '@opennextjs/cloudflare';
import { cacheLife } from 'next/cache';

interface PublicEnv {
  siteUrl: string;
  contactEmail: string;
}

export async function getPublicEnv(): Promise<PublicEnv> {
  'use cache';
  cacheLife('days');
  const { env } = await getCloudflareContext({ async: true });

  return {
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL,
  };
}
