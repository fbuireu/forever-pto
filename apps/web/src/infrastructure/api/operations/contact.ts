import type { ContactFormData } from "@application/dto/contact/schema";
import { sendContactEmail } from "@application/use-cases/contact";
import { describeFailure } from "@infrastructure/api/errors";
import type { ValidationError } from "@infrastructure/errors";
import { ApplicationLayer } from "@infrastructure/layers";
import type { PublicEnv } from "@infrastructure/services/env/getPublicEnv";
import { Effect } from "effect";
import { after } from "next/server";
import type { ApiOutcome } from "./types";

type ContactBody = { success: true } | { success: false; error: string };

export interface SendContactRequestParams {
	input: Effect.Effect<ContactFormData, ValidationError>;
	config: PublicEnv;
}

export const sendContactRequest = ({ input, config }: SendContactRequestParams): Promise<ApiOutcome<ContactBody>> =>
	Effect.runPromise(
		input.pipe(
			Effect.flatMap((body) => sendContactEmail({ data: body, config })),
			Effect.map(({ deferred }) => {
				after(() => Effect.runPromise(deferred.pipe(Effect.provide(ApplicationLayer))));
				return { status: 200, body: { success: true as const } };
			}),
			Effect.provide(ApplicationLayer),
			Effect.catchAll((failure) => {
				const { status, error } = describeFailure(failure);
				return Effect.succeed({ status, body: { success: false as const, error } });
			}),
		),
	);
