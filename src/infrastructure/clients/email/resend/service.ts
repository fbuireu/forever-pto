import type { SendEmailParams } from "@application/dto/email/types";
import { EmailError } from "@infrastructure/errors";
import { Context, Effect, Layer } from "effect";
import { Resend } from "resend";

export class ResendService extends Context.Tag("ResendService")<
	ResendService,
	{
		send(params: SendEmailParams): Effect.Effect<{ messageId: string | undefined }, EmailError>;
	}
>() {}

export const ResendServiceLive = Layer.sync(ResendService, () => {
	let resend: Resend | null = null;

	const getResend = () => {
		if (!resend) {
			const apiKey = process.env.RESEND_API_KEY;
			if (!apiKey) throw new Error("RESEND_API_KEY must be defined");
			resend = new Resend(apiKey);
		}

		return resend;
	};

	return {
		send: (params: SendEmailParams): Effect.Effect<{ messageId: string | undefined }, EmailError> =>
			Effect.tryPromise({
				try: async () => {
					const { data, error } = await getResend().emails.send(params);
					if (error) throw new Error(error.message);
					return { messageId: data?.id };
				},
				catch: (error) =>
					new EmailError({
						message: error instanceof Error ? error.message : String(error),
						cause: error,
					}),
			}),
	};
});
