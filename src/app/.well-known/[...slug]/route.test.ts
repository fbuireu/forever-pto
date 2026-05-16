import { describe, expect, it, vi } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockResolvedValue({
    env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
  }),
}));

vi.mock('@infrastructure/well-known/apiCatalog', () => ({
  apiCatalog: vi.fn().mockReturnValue(new Response('api-catalog', { status: 200 })),
}));

vi.mock('@infrastructure/well-known/mcpServerCard', () => ({
  mcpServerCard: vi.fn().mockReturnValue(new Response('mcp-server-card', { status: 200 })),
}));

vi.mock('@infrastructure/well-known/agentSkillsIndex', () => ({
  agentSkillsIndex: vi.fn().mockReturnValue(new Response('agent-skills', { status: 200 })),
}));

const { GET } = await import('./route');

function makeContext(slug: string[]) {
  return { params: Promise.resolve({ slug }) };
}

describe('GET /.well-known/[...slug]', () => {
  it('routes api-catalog to apiCatalog handler', async () => {
    const { apiCatalog } = await import('@infrastructure/well-known/apiCatalog');
    const response = await GET(new Request('http://localhost'), makeContext(['api-catalog']));
    expect(response.status).toBe(200);
    expect(apiCatalog).toHaveBeenCalledWith(BASE_URL);
  });

  it('routes mcp/server-card.json to mcpServerCard handler', async () => {
    const { mcpServerCard } = await import('@infrastructure/well-known/mcpServerCard');
    const response = await GET(new Request('http://localhost'), makeContext(['mcp', 'server-card.json']));
    expect(response.status).toBe(200);
    expect(mcpServerCard).toHaveBeenCalledWith(BASE_URL);
  });

  it('routes agent-skills/index.json to agentSkillsIndex handler', async () => {
    const { agentSkillsIndex } = await import('@infrastructure/well-known/agentSkillsIndex');
    const response = await GET(new Request('http://localhost'), makeContext(['agent-skills', 'index.json']));
    expect(response.status).toBe(200);
    expect(agentSkillsIndex).toHaveBeenCalledWith(BASE_URL);
  });

  it('returns 404 for unknown paths', async () => {
    const response = await GET(new Request('http://localhost'), makeContext(['unknown']));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
