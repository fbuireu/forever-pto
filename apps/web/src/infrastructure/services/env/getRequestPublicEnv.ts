import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PublicEnv } from "./getPublicEnv";

export function getRequestPublicEnv(): PublicEnv {
	const { env } = getCloudflareContext();

	return {
		siteUrl: env.NEXT_PUBLIC_SITE_URL,
		contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL,
	};
}
