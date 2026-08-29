import { buildMarkdownPage } from "@infrastructure/markdown/buildMarkdownPage";
import { MARKDOWN_PATH_HEADER, markdownTwinHeaders } from "@infrastructure/markdown/twin";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const notFound = () => new Response("Not Found", { status: 404, headers: markdownTwinHeaders({ found: false }) });

export async function GET(request: Request) {
	const pathname = request.headers.get(MARKDOWN_PATH_HEADER);

	if (pathname === null) return notFound();

	const { env } = await getCloudflareContext({ async: true });
	const body = await buildMarkdownPage({ baseUrl: env.NEXT_PUBLIC_SITE_URL, pathname });

	if (body === null) return notFound();

	return new Response(body, { headers: markdownTwinHeaders({ found: true }) });
}
