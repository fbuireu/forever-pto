import { TursoService } from "@infrastructure/clients/db/turso/service";
import { ResendService } from "@infrastructure/clients/email/resend/service";
import { LoggerService } from "@infrastructure/clients/logging/better-stack/service";
import { DuplicateContactError, EmailError, ValidationError } from "@infrastructure/errors";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendContactEmail } from "./contact";

vi.mock("@application/shared/utils/zodParse", () => ({
	zodParse: vi.fn(({ data }) => Effect.succeed(data)),
}));

vi.mock("@infrastructure/services/contact/repository", () => ({
	saveContact: vi.fn(() => Effect.succeed(undefined)),
	findLatestContactSince: vi.fn(() => Effect.succeed(false)),
	findContactWithMessage: vi.fn(() => Effect.succeed(false)),
}));

vi.mock("@application/email/templates/Contact", () => ({
	ContactFormEmail: vi.fn(() => null),
}));

vi.mock("@react-email/render", () => ({
	render: vi.fn().mockResolvedValue("<html>email</html>"),
}));

const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), logError: vi.fn() };
const mockSend = vi.fn(() => Effect.succeed({ messageId: "msg_123" }));
const TestLayer = Layer.mergeAll(
	Layer.succeed(LoggerService, mockLogger),
	Layer.succeed(ResendService, { send: mockSend }),
	Layer.succeed(TursoService, { query: vi.fn(), execute: vi.fn() }),
);

type ContactR = LoggerService | ResendService | TursoService;
const run = <A, E>(eff: Effect.Effect<A, E, ContactR>) => Effect.runPromise(eff.pipe(Effect.provide(TestLayer)));
const runFail = <A, E>(eff: Effect.Effect<A, E, ContactR>) =>
	Effect.runPromise(Effect.flip(eff).pipe(Effect.provide(TestLayer)));
const runDeferred = (deferred: Effect.Effect<void, never, TursoService>) =>
	Effect.runPromise(deferred.pipe(Effect.provide(TestLayer)));

const VALID_DATA = {
	name: "Alice Smith",
	email: "alice@example.com",
	subject: "Test subject",
	message: "This is a test message for the contact form.",
};
const CONFIG = { siteUrl: "https://example.com", contactEmail: "contact@example.com" };

beforeEach(() => vi.clearAllMocks());

describe("sendContactEmail", () => {
	it("resolves with a deferred effect on success", async () => {
		const result = await run(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		expect(result.deferred).toBeDefined();
	});

	it("does not persist the contact during the critical path", async () => {
		const { saveContact } = await import("@infrastructure/services/contact/repository");
		await run(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		expect(saveContact).not.toHaveBeenCalled();
	});

	it("persists the contact when the deferred effect runs", async () => {
		const { saveContact } = await import("@infrastructure/services/contact/repository");
		const { deferred } = await run(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		await runDeferred(deferred);
		expect(saveContact).toHaveBeenCalledOnce();
	});

	it("calls resend.send once", async () => {
		await run(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		expect(mockSend).toHaveBeenCalledOnce();
	});

	it("sends from and to contactEmail", async () => {
		await run(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({ to: "contact@example.com", from: expect.stringContaining("contact@example.com") }),
		);
	});

	it("passes siteUrl to the email template", async () => {
		await run(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		const { ContactFormEmail } = await import("@application/email/templates/Contact");
		expect(vi.mocked(ContactFormEmail)).toHaveBeenCalledWith(
			expect.objectContaining({ baseUrl: "https://example.com" }),
		);
	});

	it("includes the subject in the email", async () => {
		await run(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({ subject: expect.stringContaining("Test subject") }),
		);
	});

	it("fails with ValidationError when zodParse fails", async () => {
		const { zodParse } = await import("@application/shared/utils/zodParse");
		vi.mocked(zodParse).mockReturnValueOnce(Effect.fail(new ValidationError({ message: "invalid" })));
		const err = await runFail(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		expect(err).toBeInstanceOf(ValidationError);
		expect(mockSend).not.toHaveBeenCalled();
	});

	it("fails with EmailError when render throws", async () => {
		const { render } = await import("@react-email/render");
		vi.mocked(render).mockRejectedValueOnce(new Error("template error"));
		const err = await runFail(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		expect(err).toBeInstanceOf(EmailError);
		expect(mockSend).not.toHaveBeenCalled();
	});

	it("fails with EmailError when send fails", async () => {
		mockSend.mockReturnValueOnce(Effect.fail(new EmailError({ message: "send failed" })) as never);
		const err = await runFail(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		expect(err).toBeInstanceOf(EmailError);
	});

	it("deferred effect recovers and logs when saveContact fails", async () => {
		const { saveContact } = await import("@infrastructure/services/contact/repository");
		vi.mocked(saveContact).mockReturnValueOnce(Effect.fail({ _tag: "DatabaseError", message: "db error" } as never));
		const { deferred } = await run(sendContactEmail({ data: VALID_DATA, config: CONFIG }));
		await expect(runDeferred(deferred)).resolves.toBeUndefined();
		expect(mockLogger.error).toHaveBeenCalledOnce();
	});
});

describe("the guard in front of the send", () => {
	it("refuses a second message from the same sender inside the cooldown window", async () => {
		const { findLatestContactSince } = await import("@infrastructure/services/contact/repository");
		vi.mocked(findLatestContactSince).mockReturnValueOnce(Effect.succeed(true));

		const err = await runFail(sendContactEmail({ data: VALID_DATA, config: CONFIG }));

		expect(err).toBeInstanceOf(DuplicateContactError);
		expect((err as DuplicateContactError).reason).toBe("cooldown");
	});

	it("refuses the same message again whatever the window says", async () => {
		const { findContactWithMessage } = await import("@infrastructure/services/contact/repository");
		vi.mocked(findContactWithMessage).mockReturnValueOnce(Effect.succeed(true));

		const err = await runFail(sendContactEmail({ data: VALID_DATA, config: CONFIG }));

		expect(err).toBeInstanceOf(DuplicateContactError);
		expect((err as DuplicateContactError).reason).toBe("repeated");
	});

	it("refuses before spending the send, so a refusal costs no email and no row", async () => {
		const { findLatestContactSince, saveContact } = await import("@infrastructure/services/contact/repository");
		vi.mocked(findLatestContactSince).mockReturnValueOnce(Effect.succeed(true));

		await runFail(sendContactEmail({ data: VALID_DATA, config: CONFIG }));

		expect(mockSend).not.toHaveBeenCalled();
		expect(saveContact).not.toHaveBeenCalled();
	});

	it("keys the lookups on the sender with its plus-alias stripped, so an alias is not a new sender", async () => {
		const { findLatestContactSince } = await import("@infrastructure/services/contact/repository");
		await run(
			sendContactEmail({ data: { ...VALID_DATA, email: "  Someone+forever-pto@Example.com " }, config: CONFIG }),
		);

		expect(findLatestContactSince).toHaveBeenCalledWith(expect.objectContaining({ senderKey: "someone@example.com" }));
	});
});
