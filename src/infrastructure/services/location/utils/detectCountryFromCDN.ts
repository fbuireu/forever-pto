import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const LOCATION_IDENTIFIER = 'loc=';
const CDN_TRACE = 'cdn-cgi/trace';

export async function detectCountryFromCDN(): Promise<string> {
  try {
    const { env } = getCloudflareContext();
    const response = await fetch(`${env.NEXT_PUBLIC_SITE_URL}/${CDN_TRACE}`, {
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error('Error while getting information from the CDN');
    }

    const lines = (await response.text()).split('\n');
    const location = lines.find((line) => line.startsWith(LOCATION_IDENTIFIER));

    if (location) {
      return location.substring(LOCATION_IDENTIFIER.length).trim().toLowerCase();
    }

    return '';
  } catch (error) {
    getBetterStackInstance().warn('Error while detecting country from CDN', { error });
    return '';
  }
}
