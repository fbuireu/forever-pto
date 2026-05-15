import { describe, expect, it } from 'vitest';
import { mcpServerCard } from './mcpServerCard';

const BASE_URL = 'https://forever-pto.com';

describe('mcpServerCard', () => {
  it('returns 200 with json content-type', () => {
    const res = mcpServerCard(BASE_URL);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('sets schemaVersion to v1', async () => {
    const body = await mcpServerCard(BASE_URL).json();
    expect(body.schemaVersion).toBe('v1');
  });

  it('sets serverInfo url to baseUrl', async () => {
    const { serverInfo } = await mcpServerCard(BASE_URL).json();
    expect(serverInfo.url).toBe(BASE_URL);
  });

  it('declares no capabilities', async () => {
    const { capabilities } = await mcpServerCard(BASE_URL).json();
    expect(capabilities).toEqual({ resources: false, tools: false, prompts: false });
  });
});
