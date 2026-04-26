import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import pkg from '../../../../package.json';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string[] }>;
}

function apiCatalog(baseUrl: string) {
  return NextResponse.json(
    {
      linkset: [
        {
          anchor: baseUrl,
          'https://www.iana.org/assignments/link-relations/service-doc': [
            { href: `${baseUrl}/api/health`, type: 'application/json' },
          ],
          'https://www.iana.org/assignments/link-relations/status': [{ href: `${baseUrl}/api/health` }],
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/linkset+json',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}

function mcpServerCard(baseUrl: string) {
  return NextResponse.json(
    {
      schema_version: 'v1',
      server_info: {
        name: 'Forever PTO',
        version: pkg.version,
        description:
          'PTO optimization tool — maximize vacation days by combining PTO with public holidays and bridge days.',
        url: baseUrl,
      },
      capabilities: {
        resources: false,
        tools: false,
        prompts: false,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}

function agentSkillsIndex(baseUrl: string) {
  return NextResponse.json(
    {
      $schema: 'https://agentskills.io/schema/v0.2.0/index.json',
      name: 'Forever PTO',
      version: pkg.version,
      description:
        'PTO optimization tool — maximize vacation days by combining PTO with public holidays and bridge days.',
      skills: [
        {
          name: 'markdown-negotiation',
          type: 'skill',
          description: 'Returns page content as Markdown when requested with Accept: text/markdown header.',
          url: `${baseUrl}/.well-known/agent-skills/markdown-negotiation/SKILL.md`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          name: 'api-catalog',
          type: 'skill',
          description: 'Publishes an RFC 9727 API catalog at /.well-known/api-catalog.',
          url: `${baseUrl}/.well-known/agent-skills/api-catalog/SKILL.md`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          name: 'mcp-server-card',
          type: 'skill',
          description: 'Serves an MCP Server Card (SEP-1649) at /.well-known/mcp/server-card.json.',
          url: `${baseUrl}/.well-known/agent-skills/mcp-server-card/SKILL.md`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          name: 'webmcp',
          type: 'skill',
          description: 'Exposes site tools to AI agents via navigator.modelContext.provideContext().',
          url: `${baseUrl}/.well-known/agent-skills/webmcp/SKILL.md`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const path = slug.join('/');

  const { env } = await getCloudflareContext({ async: true });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL ?? 'https://foreverpto.com';

  if (path === 'api-catalog') return apiCatalog(baseUrl);
  if (path === 'mcp/server-card.json') return mcpServerCard(baseUrl);
  if (path === 'agent-skills/index.json') return agentSkillsIndex(baseUrl);

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
