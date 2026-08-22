export function apiCatalog(baseUrl: string) {
	return {
		linkset: [
			{
				anchor: baseUrl,
				"https://www.iana.org/assignments/link-relations/service-doc": [
					{ href: `${baseUrl}/api/health`, type: "application/json" },
				],
				"https://www.iana.org/assignments/link-relations/status": [{ href: `${baseUrl}/api/health` }],
			},
		],
	};
}
