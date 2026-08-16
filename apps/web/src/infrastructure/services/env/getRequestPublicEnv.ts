import type { PublicEnv } from '@infrastructure/services/env/getPublicEnv';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export function getRequestPublicEnv(): PublicEnv {
  const { env } = getCloudflareContext();

  return {
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL,
  };
}
