import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface PublicEnv {
	siteUrl: string;
	contactEmail: string;
}

export async function getPublicEnv(): Promise<PublicEnv> {
	const { env } = await getCloudflareContext({ async: true });

	return {
		siteUrl: env.NEXT_PUBLIC_SITE_URL,
		contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL,
	};
}
