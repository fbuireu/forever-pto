import { describe, expect, it, vi } from 'vitest';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockResolvedValue({
    env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
  }),
}));

vi.mock('@infrastructure/markdown/buildMarkdownPage', () => ({
  buildMarkdownPage: vi.fn().mockResolvedValue('# Forever PTO\n\nMarkdown content'),
}));

const { GET } = await import('./route');

describe('GET /api/markdown', () => {
  it('returns 200 with text/markdown content-type', async () => {
    const request = new Request('http://localhost/api/markdown');
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
  });

  it('sets Cache-Control with max-age', async () => {
    const request = new Request('http://localhost/api/markdown');
    const response = await GET(request);
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
  });

  it('returns the built markdown content', async () => {
    const request = new Request('http://localhost/api/markdown');
    const response = await GET(request);
    const text = await response.text();
    expect(text).toBe('# Forever PTO\n\nMarkdown content');
  });

  it('passes the path query param to buildMarkdownPage', async () => {
    const { buildMarkdownPage } = await import('@infrastructure/markdown/buildMarkdownPage');
    const request = new Request('http://localhost/api/markdown?path=/en/planner');
    await GET(request);
    expect(buildMarkdownPage).toHaveBeenCalledWith(process.env.NEXT_PUBLIC_SITE_URL, '/en/planner');
  });

  it('defaults path to / when query param is absent', async () => {
    const { buildMarkdownPage } = await import('@infrastructure/markdown/buildMarkdownPage');
    const request = new Request('http://localhost/api/markdown');
    await GET(request);
    expect(buildMarkdownPage).toHaveBeenCalledWith(process.env.NEXT_PUBLIC_SITE_URL, '/');
  });
});
