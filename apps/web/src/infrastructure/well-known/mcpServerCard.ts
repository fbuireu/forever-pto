import pkg from "../../../package.json";

interface McpServerInfo {
	name: string;
	version: string;
	description: string;
	url: string;
}

interface McpServerCapabilities {
	resources: boolean;
	tools: boolean;
	prompts: boolean;
}

interface McpServerCard {
	schemaVersion: string;
	serverInfo: McpServerInfo;
	capabilities: McpServerCapabilities;
}

export function mcpServerCard(baseUrl: string): McpServerCard {
	return {
		schemaVersion: "v1",
		serverInfo: {
			name: "Forever PTO",
			version: pkg.version,
			description:
				"PTO optimization tool: maximize vacation days by combining PTO with public holidays and bridge days.",
			url: baseUrl,
		},
		capabilities: {
			resources: false,
			tools: false,
			prompts: false,
		},
	};
}
