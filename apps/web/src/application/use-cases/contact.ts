import { contactCooldownStart, contactSenderKey } from "@application/dto/contact/rules";
import type { ContactFormData } from "@application/dto/contact/schema";
import { contactSchema } from "@application/dto/contact/schema";
import { ContactFormEmail } from "@application/email/templates/Contact";
import { emailDomain } from "@application/shared/utils/redact";
import { zodParse } from "@application/shared/utils/zodParse";
import type { TursoService } from "@infrastructure/clients/db/turso/service";
import { ResendService } from "@infrastructure/clients/email/resend/service";
import { type DatabaseError, DuplicateContactError, EmailError, type ValidationError } from "@infrastructure/errors";
import { LoggerService } from "@infrastructure/logging/service";
import {
	findContactWithMessage,
	recordContactMessageId,
	releaseContactSlot,
	reserveContactSlot,
} from "@infrastructure/services/contact/repository";
import { render } from "@react-email/render";
import { Effect } from "effect";

interface ContactEmailConfig {
	siteUrl: string;
	contactEmail: string;
}

export interface SendContactEmailParams {
	data: ContactFormData;
	config: ContactEmailConfig;
}

export const sendContactEmail = ({
	data,
	config,
}: SendContactEmailParams): Effect.Effect<
	{ deferred: Effect.Effect<void, never, TursoService> },
	ValidationError | EmailError | DuplicateContactError | DatabaseError,
	ResendService | LoggerService | TursoService
> =>
	Effect.gen(function* () {
		const logger = yield* LoggerService;

		const validated = yield* zodParse({ schema: contactSchema, data });
		const senderKey = contactSenderKey(validated.email);

		const slot = yield* reserveContactSlot({
			senderKey,
			since: contactCooldownStart({ now: new Date() }),
			contact: {
				email: validated.email,
				name: validated.name,
				subject: validated.subject,
				message: validated.message,
				messageId: null,
				origin: null,
			},
		});

		if (slot === null) {
			const repeated = yield* findContactWithMessage({ senderKey, message: validated.message });
			const reason = repeated ? "repeated" : "cooldown";
			logger.info({
				message: "Contact refused before sending",
				context: {
					reason,
					emailDomain: emailDomain(validated.email),
				},
			});

			return yield* Effect.fail(new DuplicateContactError({ reason }));
		}

		const releaseAfter = (failure: EmailError) =>
			releaseContactSlot(slot).pipe(
				Effect.tapBoth({
					onFailure: (error) =>
						Effect.sync(() =>
							logger.error({
								message: "Contact reservation could not be released after the email failed",
								context: { reason: error.message, emailDomain: emailDomain(validated.email) },
							}),
						),
					onSuccess: () =>
						Effect.sync(() =>
							logger.warn({
								message: "Contact reservation released after the email failed",
								context: { reason: failure.message, emailDomain: emailDomain(validated.email) },
							}),
						),
				}),
				Effect.ignore,
				Effect.andThen(Effect.fail(failure)),
			);

		const emailHtml = yield* Effect.tryPromise({
			try: () => render(ContactFormEmail({ ...validated, baseUrl: config.siteUrl })),
			catch: (error) => {
				logger.logError({
					message: "Contact email render failed",
					error,
					context: {
						emailDomain: emailDomain(validated.email),
						name: validated.name,
						subject: validated.subject,
					},
				});
				return new EmailError({ message: "Email render failed", cause: error });
			},
		}).pipe(Effect.catchAll(releaseAfter));

		const resend = yield* ResendService;
		const { messageId } = yield* resend
			.send({
				from: `Forever PTO <${config.contactEmail}>`,
				to: config.contactEmail,
				subject: `[Forever PTO Contact] ${validated.subject}`,
				html: emailHtml,
				replyTo: validated.email,
				tags: [{ name: "category", value: "web_contact_form" }],
			})
			.pipe(Effect.catchAll(releaseAfter));

		const deferred = Effect.suspend(() =>
			recordContactMessageId({ id: slot, messageId: messageId ?? null }).pipe(
				Effect.catchAll((e) =>
					Effect.sync(() => {
						logger.error({
							message: "Failed to save contact to database",
							context: {
								reason: e.message,
								emailDomain: emailDomain(validated.email),
								messageId: messageId ?? undefined,
							},
						});
					}),
				),
			),
		);

		return { deferred };
	}).pipe(Effect.withSpan("sendContactEmail"));
