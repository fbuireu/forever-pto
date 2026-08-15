import { buildMarkdownPage } from '@infrastructure/markdown/buildMarkdownPage';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const stages: string[] = [];
  try {
    stages.push('start');
    const { env } = await getCloudflareContext({ async: true });
    stages.push('ctx-ok');
    const baseUrl = env.NEXT_PUBLIC_SITE_URL;
    stages.push(`baseUrl=${String(baseUrl)}`);
    const pathname = new URL(request.url).searchParams.get('path') ?? '/';
    stages.push(`path=${pathname}`);

    const body = await buildMarkdownPage(baseUrl, pathname);
    stages.push(`built len=${body.length}`);

    return new Response(body, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        Vary: 'Accept',
      },
    });
  } catch (error) {
    const e = error as Error;
    return new Response(`DIAG-FAIL stages=${stages.join('|')} name=${e?.name} msg=${e?.message} stack=${e?.stack}`, {
      status: 599,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
