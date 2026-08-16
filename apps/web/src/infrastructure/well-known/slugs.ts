export const WELL_KNOWN_CACHE_CONTROL = 'public, max-age=86400';

export const API_CATALOG_SLUG = 'api-catalog';
export const MCP_SERVER_CARD_SLUG = 'mcp/server-card.json';
export const AGENT_SKILLS_INDEX_SLUG = 'agent-skills/index.json';

export const wellKnownUrl = (baseUrl: string, slug: string) => `${baseUrl}/.well-known/${slug}`;
