import { getCloudflareContext } from '@opennextjs/cloudflare';

const LIMIT = 10;
const WINDOW_SECONDS = 60;

export const checkPaymentRateLimit = async (ip: string): Promise<boolean> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const key = `rl:payment:${ip}`;
    const current = await env.RATE_LIMIT_KV.get(key);
    const count = current ? Number.parseInt(current, 10) : 0;

    if (count >= LIMIT) return false;

    await env.RATE_LIMIT_KV.put(key, String(count + 1), {
      expirationTtl: WINDOW_SECONDS,
    });

    return true;
  } catch {
    return true;
  }
};
