import { describe, expect, it } from 'vitest';
import { agentSkillsIndex } from './agentSkillsIndex';

const BASE_URL = 'https://forever-pto.com';

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

  it('prefixes all skill urls with baseUrl', async () => {
    const { skills } = await agentSkillsIndex(BASE_URL).json();
    for (const skill of skills) {
      expect(skill.url).toMatch(new RegExp(`^${BASE_URL}`));
    }
  });
});
