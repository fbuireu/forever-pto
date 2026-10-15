"use server";

import type { ContactFormData } from "@application/dto/contact/schema";
import { type ContactBody, sendContactRequest } from "@infrastructure/api/operations/contact";
import { getRequestPublicEnv } from "@infrastructure/services/env/getRequestPublicEnv";
import { Effect } from "effect";

export async function sendContactEmailAction(data: ContactFormData): Promise<ContactBody> {
	const { body } = await sendContactRequest({ input: Effect.succeed(data), config: getRequestPublicEnv() });

	return body;
}
