import { buildMarkdownPage } from '@infrastructure/markdown/buildMarkdownPage';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const pathname = new URL(request.url).searchParams.get('path') ?? '/';

  const body = await buildMarkdownPage(baseUrl, pathname);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
