import pkg from "../../../package.json";

export function mcpServerCard(baseUrl: string) {
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
