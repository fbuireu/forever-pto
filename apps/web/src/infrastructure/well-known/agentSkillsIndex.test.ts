import { describe, expect, it } from 'vitest';
import { agentSkillsIndex } from './agentSkillsIndex';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

describe('agentSkillsIndex', () => {
  it('returns 200 with json content-type', () => {
    const res = agentSkillsIndex(BASE_URL);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('includes all expected skill names', async () => {
    const { skills } = await agentSkillsIndex(BASE_URL).json();
    const names = skills.map((s: { name: string }) => s.name);
    expect(names).toContain('markdown-negotiation');
    expect(names).toContain('api-catalog');
    expect(names).toContain('mcp-server-card');
    expect(names).toContain('webmcp');
    expect(names).toContain('calendar-export');
  });

  it('prefixes every advertised url with baseUrl', async () => {
    const { skills } = await agentSkillsIndex(BASE_URL).json();
    for (const skill of skills.filter((entry: { url?: string }) => entry.url)) {
      expect(skill.url).toMatch(new RegExp(`^${BASE_URL}`));
    }
  });

  it('advertises only documents the .well-known handler actually serves', async () => {
    const { skills } = await agentSkillsIndex(BASE_URL).json();
    const served = [`${BASE_URL}/.well-known/api-catalog`, `${BASE_URL}/.well-known/mcp/server-card.json`];

    for (const skill of skills.filter((entry: { url?: string }) => entry.url)) {
      expect(served).toContain(skill.url);
    }
  });

  it('claims no digest, since nothing here is a file whose contents could be hashed', async () => {
    const { skills } = await agentSkillsIndex(BASE_URL).json();
    for (const skill of skills) {
      expect(skill.sha256).toBeUndefined();
    }
  });
});
