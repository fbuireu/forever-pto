import { describe, expect, it } from 'vitest';
import { agentSkillsIndex } from './agentSkillsIndex';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

describe('agentSkillsIndex', () => {
  it('includes all expected skill names', () => {
    const { skills } = agentSkillsIndex(BASE_URL);
    const names = skills.map((s: { name: string }) => s.name);
    expect(names).toContain('markdown-negotiation');
    expect(names).toContain('api-catalog');
    expect(names).toContain('mcp-server-card');
    expect(names).toContain('webmcp');
    expect(names).toContain('calendar-export');
  });

  it('prefixes every advertised url with baseUrl', () => {
    const { skills } = agentSkillsIndex(BASE_URL);
    for (const skill of skills.filter((entry: { url?: string }) => entry.url)) {
      expect(skill.url).toMatch(new RegExp(`^${BASE_URL}`));
    }
  });

  it('advertises only documents the .well-known handler actually serves', () => {
    const { skills } = agentSkillsIndex(BASE_URL);
    const served = [`${BASE_URL}/.well-known/api-catalog`, `${BASE_URL}/.well-known/mcp/server-card.json`];

    for (const skill of skills.filter((entry: { url?: string }) => entry.url)) {
      expect(served).toContain(skill.url);
    }
  });

  it('claims no digest, since nothing here is a file whose contents could be hashed', () => {
    const { skills } = agentSkillsIndex(BASE_URL);
    for (const skill of skills) {
      expect(skill).not.toHaveProperty('sha256');
    }
  });
});

describe('the advertised urls and the served slugs are one list', () => {
  it('never advertises a url the catch-all route has no key for', async () => {
    const { WELL_KNOWN_DOCUMENTS } = await import('./documents');
    const served = new Set(Object.keys(WELL_KNOWN_DOCUMENTS).map((slug) => `${BASE_URL}/.well-known/${slug}`));

    const advertised = agentSkillsIndex(BASE_URL)
      .skills.map((skill) => ('url' in skill ? skill.url : undefined))
      .filter((url): url is string => !!url);

    expect(advertised.length).toBeGreaterThan(0);
    for (const url of advertised) {
      expect(served).toContain(url);
    }
  });
});
