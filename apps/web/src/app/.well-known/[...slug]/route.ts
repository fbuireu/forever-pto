import { ApiError } from "@infrastructure/api/errors";
import { lookupWellKnownDocument } from "@infrastructure/well-known/documents";
import { WELL_KNOWN_CACHE_CONTROL } from "@infrastructure/well-known/slugs";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

interface RouteContext {
	params: Promise<{ slug: string[] }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
	const { slug } = await params;
	const document = lookupWellKnownDocument(slug.join("/"));

	if (!document) return NextResponse.json({ error: ApiError.NOT_FOUND }, { status: 404 });

	const { env } = await getCloudflareContext({ async: true });

	return NextResponse.json(document.build(env.NEXT_PUBLIC_SITE_URL), {
		headers: {
			"Content-Type": document.contentType,
			"Cache-Control": WELL_KNOWN_CACHE_CONTROL,
		},
	});
}
