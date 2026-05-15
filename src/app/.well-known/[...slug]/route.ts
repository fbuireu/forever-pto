import { agentSkillsIndex } from '@infrastructure/well-known/agentSkillsIndex';
import { apiCatalog } from '@infrastructure/well-known/apiCatalog';
import { mcpServerCard } from '@infrastructure/well-known/mcpServerCard';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Handler = (baseUrl: string) => NextResponse;

interface RouteContext {
  params: Promise<{ slug: string[] }>;
}

const ROUTES: Record<string, Handler> = {
  'api-catalog': apiCatalog,
  'mcp/server-card.json': mcpServerCard,
  'agent-skills/index.json': agentSkillsIndex,
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const path = slug.join('/');

  const handler = ROUTES[path];
  if (!handler) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { env } = await getCloudflareContext({ async: true });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL ?? 'https://forever-pto.com';

  return handler(baseUrl);
}
