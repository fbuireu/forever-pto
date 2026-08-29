import { agentSkillsIndex } from "./agentSkillsIndex";
import { apiCatalog } from "./apiCatalog";
import { mcpServerCard } from "./mcpServerCard";
import { AGENT_SKILLS_INDEX_SLUG, API_CATALOG_SLUG, MCP_SERVER_CARD_SLUG } from "./slugs";

export interface WellKnownDocument {
	contentType: string;
	build: (baseUrl: string) => unknown;
}

const WELL_KNOWN_DOCUMENTS = new Map<string, WellKnownDocument>([
	[API_CATALOG_SLUG, { contentType: "application/linkset+json", build: apiCatalog }],
	[MCP_SERVER_CARD_SLUG, { contentType: "application/json", build: mcpServerCard }],
	[AGENT_SKILLS_INDEX_SLUG, { contentType: "application/json", build: agentSkillsIndex }],
]);

export const lookupWellKnownDocument = (slug: string): WellKnownDocument | undefined => WELL_KNOWN_DOCUMENTS.get(slug);

export const wellKnownSlugs = (): string[] => [...WELL_KNOWN_DOCUMENTS.keys()];
