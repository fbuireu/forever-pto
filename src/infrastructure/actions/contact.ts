"use server";

import type { ContactFormData } from "@application/dto/contact/schema";
import { sendContactRequest } from "@infrastructure/api/operations/contact";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Effect } from "effect";

export async function sendContactEmailAction(data: ContactFormData) {
	const { env } = getCloudflareContext();

	const { body } = await sendContactRequest(Effect.succeed(data), {
		siteUrl: env.NEXT_PUBLIC_SITE_URL,
		contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL,
	});

	return body;
}
