import pkg from "../../../package.json";
import { API_CATALOG_SLUG, MCP_SERVER_CARD_SLUG, wellKnownUrl } from "./slugs";

export function agentSkillsIndex(baseUrl: string) {
	return {
		$schema: "https://agentskills.io/schema/v0.2.0/index.json",
		name: "Forever PTO",
		version: pkg.version,
		description:
			"PTO optimization tool — maximize vacation days by combining PTO with public holidays and bridge days.",
		skills: [
			{
				name: "markdown-negotiation",
				type: "skill",
				description: "Returns page content as Markdown when requested with Accept: text/markdown header.",
			},
			{
				name: "api-catalog",
				type: "skill",
				description: "Publishes an RFC 9727 API catalog at /.well-known/api-catalog.",
				url: wellKnownUrl(baseUrl, API_CATALOG_SLUG),
			},
			{
				name: "mcp-server-card",
				type: "skill",
				description: "Serves an MCP Server Card (SEP-1649) at /.well-known/mcp/server-card.json.",
				url: wellKnownUrl(baseUrl, MCP_SERVER_CARD_SLUG),
			},
			{
				name: "webmcp",
				type: "skill",
				description: "Exposes site tools to AI agents via navigator.modelContext.provideContext().",
			},
			{
				name: "calendar-export",
				type: "feature",
				description:
					"Export vacation plans as a .ics file (importable into Google Calendar, Apple Calendar, Outlook) or as a PDF for printing or sharing.",
			},
		],
	};
}
