import type { ContactFormData } from "@application/dto/contact/schema";
import { ResendService } from "@infrastructure/clients/email/resend/service";
import { DatabaseError, DuplicateContactError, EmailError, ValidationError } from "@infrastructure/errors";
import { LoggerService } from "@infrastructure/logging/service";
import { createContactsFixture } from "@infrastructure/services/contact/fixture";
import { type Context, Effect, Either, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendContactEmail } from "./contact";

vi.mock("@application/shared/utils/zodParse", () => ({
	zodParse: vi.fn(({ data }) => Effect.succeed(data)),
}));

vi.mock("@application/email/templates/Contact", () => ({
	ContactFormEmail: vi.fn(() => null),
}));

vi.mock("@react-email/render", () => ({
	render: vi.fn().mockResolvedValue("<html>email</html>"),
}));

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const mockSend = vi.fn<Context.Tag.Service<typeof ResendService>["send"]>();

let contacts = createContactsFixture();

const services = () =>
	Layer.mergeAll(
		Layer.succeed(LoggerService, mockLogger),
		Layer.succeed(ResendService, { send: mockSend }),
		contacts.layer,
	);

type ContactR = Layer.Layer.Success<ReturnType<typeof services>>;

const run = <A, E>(eff: Effect.Effect<A, E, ContactR>) => Effect.runPromise(eff.pipe(Effect.provide(services())));
const runFail = <A, E>(eff: Effect.Effect<A, E, ContactR>) =>
	Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(services())));

const VALID_DATA: ContactFormData = {
	name: "Alice Smith",
	email: "alice@example.com",
	subject: "Test subject",
	message: "This is a test message for the contact form.",
};
const CONFIG = { siteUrl: "https://example.com", contactEmail: "contact@example.com" };

const submit = (data: ContactFormData = VALID_DATA) => sendContactEmail({ data, config: CONFIG });

const submitTogether = (submissions: ContactFormData[]) =>
	run(
		Effect.all(
			submissions.map((data) => Effect.either(submit(data))),
			{ concurrency: "unbounded" },
		),
	);

const completeAfterResponse = async (outcomes: Awaited<ReturnType<typeof submitTogether>>) => {
	for (const outcome of outcomes) if (Either.isRight(outcome)) await run(outcome.right.deferred);
};

const storedRows = () => contacts.database.prepare("SELECT email, message, message_id FROM contacts").all();

interface SeedParams {
	email: string;
	message: string;
	age: string;
}

const seed = ({ email, message, age }: SeedParams) =>
	contacts.database
		.prepare(
			`INSERT INTO contacts (id, email, name, subject, message, message_id, origin, created_date, updated_at)
       VALUES (?, ?, 'Earlier', 'Earlier', ?, 'msg_earlier', NULL, datetime('now', ?), datetime('now', ?))`,
		)
		.run(crypto.randomUUID(), email, message, age, age);

const refusalLog = (reason: "cooldown" | "repeated") => [
	{ message: "Contact refused before sending", context: { reason, emailDomain: "example.com" } },
];

beforeEach(() => {
	vi.clearAllMocks();
	mockSend.mockImplementation(() => Effect.succeed({ messageId: "msg_123" }));
	contacts = createContactsFixture();
});

describe("sendContactEmail", () => {
	it("resolves with a deferred effect on success", async () => {
		const result = await run(submit());
		expect(result.deferred).toBeDefined();
	});

	it("holds the sender's slot before the send and records the message id only once the deferred effect runs", async () => {
		const { deferred } = await run(submit());

		expect(storedRows()).toEqual([{ email: "alice@example.com", message: VALID_DATA.message, message_id: null }]);

		await run(deferred);

		expect(storedRows()).toEqual([{ email: "alice@example.com", message: VALID_DATA.message, message_id: "msg_123" }]);
	});

	it("calls resend.send once", async () => {
		await run(submit());
		expect(mockSend).toHaveBeenCalledOnce();
	});

	it("sends from and to contactEmail", async () => {
		await run(submit());
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({ to: "contact@example.com", from: expect.stringContaining("contact@example.com") }),
		);
	});

	it("passes siteUrl to the email template", async () => {
		await run(submit());
		const { ContactFormEmail } = await import("@application/email/templates/Contact");
		expect(vi.mocked(ContactFormEmail)).toHaveBeenCalledWith(
			expect.objectContaining({ baseUrl: "https://example.com" }),
		);
	});

	it("includes the subject in the email", async () => {
		await run(submit());
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({ subject: expect.stringContaining("Test subject") }),
		);
	});

	it("fails with ValidationError when zodParse fails, before it holds a slot", async () => {
		const { zodParse } = await import("@application/shared/utils/zodParse");
		vi.mocked(zodParse).mockReturnValueOnce(Effect.fail(new ValidationError({ message: "invalid" })));
		const err = await runFail(submit());
		expect(err).toBeInstanceOf(ValidationError);
		expect(mockSend).not.toHaveBeenCalled();
		expect(storedRows()).toEqual([]);
	});

	it("fails with EmailError when render throws, logs it as before, and frees the slot", async () => {
		const { render } = await import("@react-email/render");
		vi.mocked(render).mockRejectedValueOnce(new Error("template error"));

		const err = await runFail(submit());

		expect(err).toBeInstanceOf(EmailError);
		expect(mockSend).not.toHaveBeenCalled();
		expect(storedRows()).toEqual([]);
		expect(mockLogger.logError).toHaveBeenCalledExactlyOnceWith({
			message: "Contact email render failed",
			error: expect.any(Error),
			context: { emailDomain: "example.com", name: VALID_DATA.name, subject: VALID_DATA.subject },
		});
		expect(mockLogger.warn.mock.calls).toStrictEqual([
			[
				{
					message: "Contact reservation released after the email failed",
					context: { reason: "Email render failed", emailDomain: "example.com" },
				},
			],
		]);
	});

	it("fails with EmailError when send fails", async () => {
		mockSend.mockReturnValueOnce(Effect.fail(new EmailError({ message: "send failed" })));
		const err = await runFail(submit());
		expect(err).toBeInstanceOf(EmailError);
	});

	it("deferred effect recovers and logs when recording the message id fails", async () => {
		const { deferred } = await run(submit());
		contacts.database.exec("DROP TABLE contacts");

		await expect(run(deferred)).resolves.toBeUndefined();
		expect(mockLogger.error.mock.calls).toStrictEqual([
			[
				{
					message: "Failed to save contact to database",
					context: { reason: "no such table: contacts", emailDomain: "example.com", messageId: "msg_123" },
				},
			],
		]);
	});

	it("fails with DatabaseError, and sends nothing, when the slot cannot be held", async () => {
		contacts.database.exec("DROP TABLE contacts");

		const err = await runFail(submit());

		expect(err).toBeInstanceOf(DatabaseError);
		expect(mockSend).not.toHaveBeenCalled();
	});
});

describe("the guard in front of the send", () => {
	it("refuses a second message from the same sender inside the cooldown window", async () => {
		seed({ email: "alice@example.com", message: "An earlier message.", age: "-1 hours" });

		const err = await runFail(submit());

		expect(err).toBeInstanceOf(DuplicateContactError);
		expect((err as DuplicateContactError).reason).toBe("cooldown");
		expect(mockLogger.info.mock.calls).toStrictEqual([refusalLog("cooldown")]);
	});

	it("lets the sender write again once the cooldown window has passed", async () => {
		seed({ email: "alice@example.com", message: "An earlier message.", age: "-25 hours" });

		await run(submit());

		expect(mockSend).toHaveBeenCalledOnce();
	});

	it("refuses the same message again whatever the window says", async () => {
		seed({ email: "alice@example.com", message: VALID_DATA.message, age: "-30 days" });

		const err = await runFail(submit());

		expect(err).toBeInstanceOf(DuplicateContactError);
		expect((err as DuplicateContactError).reason).toBe("repeated");
		expect(mockLogger.info.mock.calls).toStrictEqual([refusalLog("repeated")]);
	});

	it("refuses before spending the send, so a refusal costs no email and no row", async () => {
		seed({ email: "alice@example.com", message: "An earlier message.", age: "-1 hours" });

		await runFail(submit());

		expect(mockSend).not.toHaveBeenCalled();
		expect(storedRows()).toEqual([
			{ email: "alice@example.com", message: "An earlier message.", message_id: "msg_earlier" },
		]);
	});

	it("keys the guard on the sender with its plus-alias stripped, so an alias is not a new sender", async () => {
		seed({ email: "someone@example.com", message: "An earlier message.", age: "-1 hours" });

		const err = await runFail(submit({ ...VALID_DATA, email: "  Someone+forever-pto@Example.com " }));

		expect((err as DuplicateContactError).reason).toBe("cooldown");
	});
});

describe("two submissions from one sender at the same moment", () => {
	it("send one email, and the other is refused inside the cooldown with the log it always wrote", async () => {
		const outcomes = await submitTogether([VALID_DATA, { ...VALID_DATA, message: "A second, different message." }]);
		await completeAfterResponse(outcomes);

		expect(mockSend).toHaveBeenCalledOnce();
		expect(outcomes.filter(Either.isLeft).map(({ left }) => left)).toEqual([
			new DuplicateContactError({ reason: "cooldown" }),
		]);
		expect(mockLogger.info.mock.calls).toStrictEqual([refusalLog("cooldown")]);
		expect(storedRows()).toHaveLength(1);
	});

	it("send one email when the message is the same, and the other is refused as repeated", async () => {
		const outcomes = await submitTogether([VALID_DATA, VALID_DATA]);
		await completeAfterResponse(outcomes);

		expect(mockSend).toHaveBeenCalledOnce();
		expect(outcomes.filter(Either.isLeft).map(({ left }) => left)).toEqual([
			new DuplicateContactError({ reason: "repeated" }),
		]);
		expect(mockLogger.info.mock.calls).toStrictEqual([refusalLog("repeated")]);
	});
});

describe("an email that fails after the slot is held", () => {
	it("frees the slot, so the sender's next attempt goes through", async () => {
		mockSend.mockReturnValueOnce(Effect.fail(new EmailError({ message: "Resend is down" })));

		expect(await runFail(submit())).toEqual(new EmailError({ message: "Resend is down" }));
		expect(storedRows()).toEqual([]);

		const { deferred } = await run(submit());
		await run(deferred);

		expect(mockSend).toHaveBeenCalledTimes(2);
		expect(storedRows()).toEqual([{ email: "alice@example.com", message: VALID_DATA.message, message_id: "msg_123" }]);
	});

	it("logs the release with the email's failure and the sender's domain only", async () => {
		mockSend.mockReturnValueOnce(Effect.fail(new EmailError({ message: "Resend is down" })));

		await runFail(submit());

		expect(mockLogger.warn.mock.calls).toStrictEqual([
			[
				{
					message: "Contact reservation released after the email failed",
					context: { reason: "Resend is down", emailDomain: "example.com" },
				},
			],
		]);
		expect(mockLogger.error).not.toHaveBeenCalled();
		expect(mockLogger.info).not.toHaveBeenCalled();
	});

	it("still answers with the email's failure when the slot cannot be freed, and logs that at error", async () => {
		mockSend.mockImplementationOnce(() => {
			contacts.database.exec("DROP TABLE contacts");
			return Effect.fail(new EmailError({ message: "Resend is down" }));
		});

		expect(await runFail(submit())).toEqual(new EmailError({ message: "Resend is down" }));
		expect(mockLogger.error.mock.calls).toStrictEqual([
			[
				{
					message: "Contact reservation could not be released after the email failed",
					context: { reason: "no such table: contacts", emailDomain: "example.com" },
				},
			],
		]);
		expect(mockLogger.warn).not.toHaveBeenCalled();
	});
});
