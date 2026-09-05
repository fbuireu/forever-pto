import { contactCooldownStart, contactSenderKey } from "@application/dto/contact/rules";
import type { ContactFormData } from "@application/dto/contact/schema";
import { contactSchema } from "@application/dto/contact/schema";
import { ContactFormEmail } from "@application/email/templates/Contact";
import { emailDomain } from "@application/shared/utils/redact";
import { zodParse } from "@application/shared/utils/zodParse";
import type { TursoService } from "@infrastructure/clients/db/turso/service";
import { ResendService } from "@infrastructure/clients/email/resend/service";
import { LoggerService } from "@infrastructure/clients/logging/better-stack/service";
import { type DatabaseError, DuplicateContactError, EmailError, type ValidationError } from "@infrastructure/errors";
import {
	findContactWithMessage,
	findLatestContactSince,
	saveContact,
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

		const [withinCooldown, repeated] = yield* Effect.all(
			[
				findLatestContactSince({ senderKey, since: contactCooldownStart({ now: new Date() }) }),
				findContactWithMessage({ senderKey, message: validated.message }),
			],
			{ concurrency: "unbounded" },
		);

		if (withinCooldown || repeated) {
			const reason = repeated ? "repeated" : "cooldown";
			logger.info("Contact refused before sending", {
				reason,
				emailDomain: emailDomain(validated.email),
			});

			return yield* Effect.fail(new DuplicateContactError({ reason }));
		}

		const emailHtml = yield* Effect.tryPromise({
			try: () => render(ContactFormEmail({ ...validated, baseUrl: config.siteUrl })),
			catch: (error) => {
				logger.logError("Contact email render failed", error, {
					emailDomain: emailDomain(validated.email),
					name: validated.name,
					subject: validated.subject,
				});
				return new EmailError({ message: "Email render failed", cause: error });
			},
		});

		const resend = yield* ResendService;
		const { messageId } = yield* resend.send({
			from: `Forever PTO <${config.contactEmail}>`,
			to: config.contactEmail,
			subject: `[Forever PTO Contact] ${validated.subject}`,
			html: emailHtml,
			replyTo: validated.email,
			tags: [{ name: "category", value: "web_contact_form" }],
		});

		const deferred = Effect.suspend(() =>
			saveContact({
				email: validated.email,
				name: validated.name,
				subject: validated.subject,
				message: validated.message,
				messageId: messageId ?? null,
				origin: null,
			}).pipe(
				Effect.catchAll((e) =>
					Effect.sync(() => {
						logger.error("Failed to save contact to database", {
							reason: e.message,
							emailDomain: emailDomain(validated.email),
							messageId: messageId ?? undefined,
						});
					}),
				),
			),
		);

		return { deferred };
	}).pipe(Effect.withSpan("sendContactEmail"));
