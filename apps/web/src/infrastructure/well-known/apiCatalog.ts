interface ApiCatalogLink {
	href: string;
	type?: string;
}

interface ApiCatalogLinkset {
	anchor: string;
	"https://www.iana.org/assignments/link-relations/service-doc": ApiCatalogLink[];
	"https://www.iana.org/assignments/link-relations/status": ApiCatalogLink[];
}

interface ApiCatalog {
	linkset: ApiCatalogLinkset[];
}

export function apiCatalog(baseUrl: string): ApiCatalog {
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
